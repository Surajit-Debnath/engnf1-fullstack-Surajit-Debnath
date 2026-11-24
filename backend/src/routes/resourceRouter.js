const { Router } = require("express");
const {authMiddleware}=require("../middleware/authmiddleware");
const {adminMiddleware}=require("../middleware/adminmiddleware");

const {getResourcesController} = require("../controllers/resource.controller");
const {getResourceByIdController} = require("../controllers/resourceDetails.controller");
const {createResourceController}=require("../controllers/createResource.controller");
const {updateResourceController}=require("../controllers/updateResource.controller");
const {resourceAvailabilityController}=require("../controllers/resourceAvailability.controller");
const resourceRouter = Router();

resourceRouter.get("/",authMiddleware,getResourcesController);
resourceRouter.get("/:id",authMiddleware,getResourceByIdController);
resourceRouter.post("/",adminMiddleware,createResourceController);
resourceRouter.patch("/:id", adminMiddleware,updateResourceController);
resourceRouter.get("/:id/availability",authMiddleware,resourceAvailabilityController);
module.exports = {
  resourceRouter:resourceRouter,
};
