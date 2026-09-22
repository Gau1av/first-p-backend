const express = require('express');
const router = express.Router();
const Query = require('../models/Query');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Submit a new query (Public - Contact.jsx / Home.jsx)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message, issue, service, date, details } = req.body;

    if (!name || (!message && !issue && !service)) {
      return res.status(400).json({ message: 'Please provide a name and message.' });
    }

    const normalizedMessage = message || issue || details || (
      service ? `Service: ${service}${date ? ` | Preferred date: ${date}` : ''}` : 'No issue details provided.'
    );

    const normalizedSubject = (service && String(service).trim()) ||
      (issue && String(issue).trim()) ||
      (details && String(details).trim()) ||
      'General inquiry';

    const newQuery = new Query({
      name,
      email: email || 'notprovided@example.com',
      phone: phone || '',
      subject: normalizedSubject,
      message: normalizedMessage,
      status: 'new'
    });

    await newQuery.save();
    res.status(201).json({ message: 'Query submitted successfully', query: newQuery });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Analytics for Charts (Admin - Day, Week, Month, Year breakdown)
// NOTE: Must be placed ABOVE `/:id` routes so Express doesn't match 'analytics' as an ID
router.get('/analytics', protect, adminOnly, async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let groupFormat;
    let startDate = new Date();

    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
      groupFormat = '%Y-%m-%d %H:00';
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
      groupFormat = '%Y-%m-%d';
    } else if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30);
      groupFormat = '%Y-%m-%d';
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
      groupFormat = '%Y-%m';
    } else {
      return res.status(400).json({ message: 'Invalid period parameter' });
    }

    const analytics = await Query.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: groupFormat, date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          statuses: {
            $push: {
              k: '$_id.status',
              v: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      {
        $project: {
          _id: 0,
          label: '$_id',
          total: 1,
          counts: { $arrayToObject: '$statuses' }
        }
      },
      { $sort: { label: 1 } }
    ]);

    const summary = await Query.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedSummary = {
      total: 0,
      new: 0,
      in_progress: 0,
      completed: 0,
      rejected: 0
    };

    summary.forEach((item) => {
      if (item._id) formattedSummary[item._id] = item.count;
      formattedSummary.total += item.count;
    });

    res.json({
      period,
      summary: formattedSummary,
      chartData: analytics
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all queries (Admin - Queries.jsx)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const queries = await Query.find(filter).sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update query status (Supports both PUT and PATCH)
const updateQueryStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const allowedStatuses = ['new', 'in_progress', 'completed', 'rejected'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status type' });
    }

    const updatePayload = {};
    if (status) updatePayload.status = status;
    if (adminNotes !== undefined) updatePayload.adminNotes = adminNotes;

    const updatedQuery = await Query.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!updatedQuery) {
      return res.status(404).json({ message: 'Query not found' });
    }

    res.json(updatedQuery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

router.put('/:id', protect, adminOnly, updateQueryStatus);
router.patch('/:id', protect, adminOnly, updateQueryStatus);

// Delete a query
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Query.findByIdAndDelete(req.params.id);
    res.json({ message: 'Query deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;