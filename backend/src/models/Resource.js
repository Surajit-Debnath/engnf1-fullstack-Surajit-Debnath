const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    type: {
      type: String,
      enum: ["ROOM", "LAB", "EQUIPMENT"],
      required: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    description: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource;