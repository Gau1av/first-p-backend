const mongoose = require("mongoose");

const QuerySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["new", "in_progress", "completed", "rejected"],
      default: "new",
    },
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Query", QuerySchema);