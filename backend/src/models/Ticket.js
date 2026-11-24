const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    body: {
      type: String,
      required: true,
    },

    // Original category predicted by the classifier.
    // Never change this after the ticket is created.
    autoCategory: {
      type: String,
      enum: ['BILLING', 'BUG', 'FEATURE_REQUEST', 'LOGIN', 'DELIVERY'],
      required: true,
    },

    // Current category. An agent can manually change this.
    category: {
      type: String,
      enum: ['BILLING', 'BUG', 'FEATURE_REQUEST', 'LOGIN', 'DELIVERY'],
      required: true,
    },

    isHumanOverride: {
      type: Boolean,
      default: false,
    },

    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },

    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },

    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    isReviewed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Useful for filtering tickets by status and category.
ticketSchema.index({ status: 1, category: 1 });

// Useful for finding tickets assigned to an agent.
ticketSchema.index({ assigneeId: 1 });

// Useful for sorting/filtering by creation time.
ticketSchema.index({ createdAt: -1 });

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
