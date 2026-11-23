const mongoose = require("mongoose");

const ticketEventSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },

    field: {
      type: String,
      enum: ["category", "priority", "status", "assigneeId"],
      required: true,
    },

    oldValue: {
      type: String,
      default: null,
    },

    newValue: {
      type: String,
      default: null,
    },

    actor: {
      type: String,
      required: true,
      trim:true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ticketEventSchema.index({ ticketId: 1, createdAt: -1 });

const TicketEvent = mongoose.model("TicketEvent", ticketEventSchema);

export default TicketEvent;