const TicketEvent = require('../models/TicketEvent');
const User = require('../models/User');

async function updateTicket(ticket, updates, actor) {
  const events = [];

  // Validate assignee.
  if (
    Object.prototype.hasOwnProperty.call(updates, 'assigneeId') &&
    updates.assigneeId !== null
  ) {
    const assignee = await User.findById(updates.assigneeId);

    if (!assignee) {
      return {
        error: 'ASSIGNEE_NOT_FOUND',
      };
    }
  }

  // Detect category change.
  const categoryProvided = updates.category !== undefined;

  const categoryChanged =
    categoryProvided &&
    updates.category !== ticket.category;

  // Detect status transition away from OPEN.
  const statusChangedFromOpen =
    updates.status !== undefined &&
    ticket.status === 'OPEN' &&
    updates.status !== 'OPEN';

  const fields = [
    'category',
    'priority',
    'status',
    'assigneeId',
  ];

  // Update fields and generate audit events.
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(updates, field)) {
      continue;
    }

    const oldValue = ticket[field];
    const newValue = updates[field];

    const oldComparable =
      oldValue === null || oldValue === undefined
        ? null
        : String(oldValue);

    const newComparable =
      newValue === null || newValue === undefined
        ? null
        : String(newValue);

    if (oldComparable === newComparable) {
      continue;
    }

    events.push({
      ticketId: ticket._id,
      field,
      oldValue: oldComparable,
      newValue: newComparable,
      actor,
    });

    ticket[field] = newValue;
  }

  // Protect manually changed categories from reclassification.
  if (categoryChanged) {
    ticket.isHumanOverride = true;
  }

  // Mark as reviewed only when a qualifying change occurs.
  if (categoryChanged || statusChangedFromOpen) {
    ticket.isReviewed = true;
  }

  await ticket.save();

  // Store audit events.
  if (events.length > 0) {
    await TicketEvent.insertMany(events);
  }

  return {
    ticket,
    events,
  };
}

module.exports = {
  updateTicket,
};