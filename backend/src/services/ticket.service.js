const Ticket = require("../models/Ticket");
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getTickets(filters) {
  const {
    status,
    category,
    priority,
    q,
    page,
    limit,
  } = filters;
  const query = {};
  if (status) {
    query.status = status;
  }
  if (category) {
    query.category = category;
  }
  if (priority) {
    query.priority = priority;
  }
  if (q && q.length > 0) {
    const safeSearch = escapeRegex(q);

    query.$or = [
      { subject: { $regex: safeSearch, $options: "i" } },
      { body: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [tickets, total] = await Promise.all([
    Ticket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Ticket.countDocuments(query),
  ]);

  return {
    tickets,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

module.exports = {
  getTickets,
};
