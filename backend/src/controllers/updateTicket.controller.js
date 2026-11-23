const Ticket = require("../models/Ticket");
const { objectIdSchema,updateTicketSchema} = require("../validation/ticket.schema");
const {updateTicket} = require("../services/updateTicket.service");
const {sendError} = require("../utils/apiResponse");

async function updateTicketController(req, res) {
  try {
  
    const idValidation = objectIdSchema.safeParse(req.params.id);
    if (!idValidation.success) {
      return sendError(res, 404, "NOT_FOUND", "Ticket not found");
    }
    const ticket = await Ticket.findById(idValidation.data);
    if (!ticket) {
      return sendError(res, 404, "NOT_FOUND", "Ticket not found");
    }
    const bodyValidation = updateTicketSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Invalid ticket update data"
      );
    }

    const actor =req.get("X-Agent")?.trim() || req.user.email;
    const result = await updateTicket(
      ticket,
      bodyValidation.data,
      actor
    );
    if (result.error === "ASSIGNEE_NOT_FOUND") {
      return sendError(
        res,
        404,
        "NOT_FOUND",
        "Assignee not found"
      );
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error("Update ticket error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
}

module.exports = {
  updateTicketController,
};
