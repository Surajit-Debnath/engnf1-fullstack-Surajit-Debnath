
const {ticketQuerySchema} = require("../validation/ticket.schema");
const {getTickets} = require("../services/ticket.service");

const getTicketsController = async (req, res) => {
  try {
    const validation = ticketQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid query parameters",
        errors: validation.error.issues,
      });
    }

    const result = await getTickets(validation.data);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Get tickets error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  getTicketsController,
};
