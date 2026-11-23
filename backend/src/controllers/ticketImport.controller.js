const { importTicketsSchema } = require("../validation/ticket.schema");
const { importTickets } = require("../services/ticketImport.service");

async function importTicketsController(req, res) {
  try {
    const validation = importTicketsSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid ticket import data",
        errors: validation.error.issues,
      });
    }

    const result = await importTickets(validation.data.tickets);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Ticket import error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

module.exports = {
  importTicketsController,
};
