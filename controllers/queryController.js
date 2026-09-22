const Query = require("../models/Query");

// 1. Submit a public query
exports.createQuery = async (req, res) => {
  try {
    const query = await Query.create(req.body);
    res.status(201).json({ success: true, data: query });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 2. View all queries with status filter & pagination
exports.getQueries = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = status ? { status } : {};

    const queries = await Query.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Query.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: queries,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Process / Update query status
exports.updateQueryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const allowedStatuses = ["new", "in_progress", "completed", "rejected"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const query = await Query.findByIdAndUpdate(
      id,
      { ...(status && { status }), ...(adminNotes !== undefined && { adminNotes }) },
      { new: true, runValidators: true }
    );

    if (!query) {
      return res.status(404).json({ success: false, message: "Query not found" });
    }

    res.status(200).json({ success: true, data: query });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get Chart Data (Day, Week, Month, Year)
exports.getChartAnalytics = async (req, res) => {
  try {
    const { period = "month" } = req.query;

    let groupFormat;
    let startDate = new Date();

    // Configure grouping interval and time window
    if (period === "day") {
      // Group by hour for today
      startDate.setHours(0, 0, 0, 0);
      groupFormat = "%Y-%m-%d %H:00";
    } else if (period === "week") {
      // Last 7 days grouped by YYYY-MM-DD
      startDate.setDate(startDate.getDate() - 7);
      groupFormat = "%Y-%m-%d";
    } else if (period === "month") {
      // Last 30 days grouped by YYYY-MM-DD
      startDate.setDate(startDate.getDate() - 30);
      groupFormat = "%Y-%m-%d";
    } else if (period === "year") {
      // Last 12 months grouped by YYYY-MM
      startDate.setFullYear(startDate.getFullYear() - 1);
      groupFormat = "%Y-%m";
    } else {
      return res.status(400).json({ success: false, message: "Invalid period parameter" });
    }

    const analytics = await Query.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: groupFormat, date: "$createdAt" } },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          statuses: {
            $push: {
              k: "$_id.status",
              v: "$count",
            },
          },
          total: { $sum: "$count" },
        },
      },
      {
        $project: {
          _id: 0,
          label: "$_id",
          total: 1,
          counts: { $arrayToObject: "$statuses" },
        },
      },
      { $sort: { label: 1 } },
    ]);

    // Overall summary counts
    const summary = await Query.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedSummary = {
      total: 0,
      new: 0,
      in_progress: 0,
      completed: 0,
      rejected: 0,
    };

    summary.forEach((item) => {
      formattedSummary[item._id] = item.count;
      formattedSummary.total += item.count;
    });

    res.status(200).json({
      success: true,
      period,
      summary: formattedSummary,
      chartData: analytics,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};