const {objectIdSchema} = require("../validation/ticket.schema");
const {sendError} = require("../utils/apiResponse");
const Ticket= require("../models/Ticket");
const TicketEvent= require("../models/TicketEvent");

async function getTicketDetails(ticketId) {
  const ticket = await Ticket.findById(ticketId).lean();
  if (!ticket) {
    return null;
  }
  const events = await TicketEvent.find({
    ticketId: ticket._id,
  })
    .sort({ createdAt: 1 })
    .lean();

  return {
    ticket,
    events,
  };
}
async function getTicketDetailsController(req, res) {
  try {
    const ticketId = req.params.id;
    const validation = objectIdSchema.safeParse(ticketId);
    if (!validation.success) {
      return sendError(
        res,
        404,
        "NOT_FOUND",
        "Ticket not found"
      );
    }
    const result = await getTicketDetails(validation.data);
    if (!result) {
      return sendError(
        res,
        404,
        "NOT_FOUND",
        "Ticket not found"
      );
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error("Get ticket details error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
}

module.exports = {
  getTicketDetailsController,
};
