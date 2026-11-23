const { Router } = require("express");
const { importTicketsController } = require("../controllers/ticketImport.controller");
const {getTicketsController}=require("../controllers/ticket.controller");
const {getTicketDetailsController}=require("../controllers/ticketDetails.controller");
const {updateTicketController} = require("../controllers/updateTicket.controller");
const ticketRouter = Router();

ticketRouter.post("/import", importTicketsController);
ticketRouter.get("/", getTicketsController);
ticketRouter.get("/:id",getTicketDetailsController);
ticketRouter.patch("/:id", updateTicketController);
module.exports = {
  ticketRouter:ticketRouter
};
