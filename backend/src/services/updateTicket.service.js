const TicketEvent = require('../models/TicketEvent');
const User = require('../models/User');

async function updateTicket(ticket, updates, actor) {
  const events = [];
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
  const categoryChanged =
    updates.category !== undefined && updates.category !== ticket.category;
  const statusChangedFromOpen =
    updates.status !== undefined &&
    ticket.status === 'OPEN' &&
    updates.status !== 'OPEN';
  const fields = ['category', 'priority', 'status', 'assigneeId'];

  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(updates, field)) {
      continue;
    }

    const oldValue = ticket[field];
    const newValue = updates[field];

    const oldComparable =
      oldValue === null || oldValue === undefined ? null : String(oldValue);

    const newComparable =
      newValue === null || newValue === undefined ? null : String(newValue);

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
  if (categoryChanged) {
    ticket.isHumanOverride = true;
  }
  if (categoryChanged || statusChangedFromOpen) {
    ticket.isReviewed = true;
  }
  await ticket.save();
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
