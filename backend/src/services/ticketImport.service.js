
const Ticket = require("../models/Ticket");
const { classifyTicket } = require("../utils/ticketClassifier");

async function processExistingTicket(ticket, input) {
  let changed = false;
  if (ticket.subject !== input.subject) {
    ticket.subject = input.subject;
    changed = true;
  }
  if (ticket.body !== input.body) {
    ticket.body = input.body;
    changed = true;
  }

  if (!ticket.isHumanOverride) {
    const classification = classifyTicket(
      input.subject,
      input.body
    );

    if (ticket.autoCategory !== classification.autoCategory) {
      ticket.autoCategory = classification.autoCategory;
      changed = true;
    }

    if (ticket.category !== classification.autoCategory) {
      ticket.category = classification.autoCategory;
      changed = true;
    }

    if (ticket.priority !== classification.priority) {
      ticket.priority = classification.priority;
      changed = true;
    }
  }

  if (changed) {
    await ticket.save();
  }

  return {
    changed,
    skippedOverride: ticket.isHumanOverride,
  };
}

async function importTickets(tickets) {
  let importedCount = 0;
  let updatedCount = 0;
  let skippedOverrideCount = 0;

  for (const input of tickets) {
    let existingTicket = await Ticket.findOne({
      externalId: input.externalId,
    });

    if (existingTicket) {
      const result = await processExistingTicket(
        existingTicket,
        input
      );

      if (result.changed) {
        updatedCount++;
      }

      if (result.skippedOverride) {
        skippedOverrideCount++;
      }

      continue;
    }

    const classification = classifyTicket(
      input.subject,
      input.body
    );

    try {
      await Ticket.create({
        externalId: input.externalId,
        subject: input.subject,
        body: input.body,
        autoCategory: classification.autoCategory,
        category: classification.autoCategory,
        priority: classification.priority,
        status: "OPEN",
        isHumanOverride: false,
        isReviewed: false,
        assigneeId: null,
      });

      importedCount++;
    } catch (error) {
      // Another concurrent import may have created this externalId.
      // The unique index prevents a duplicate ticket.
      if (error.code !== 11000) {
        throw error;
      }

      existingTicket = await Ticket.findOne({
        externalId: input.externalId,
      });

      if (!existingTicket) {
        throw error;
      }

      const result = await processExistingTicket(
        existingTicket,
        input
      );

      if (result.changed) {
        updatedCount++;
      }

      if (result.skippedOverride) {
        skippedOverrideCount++;
      }
    }
  }

  return {
    importedCount,
    updatedCount,
    skippedOverrideCount,
    total: tickets.length,
  };
}

module.exports = {
  importTickets,
};
