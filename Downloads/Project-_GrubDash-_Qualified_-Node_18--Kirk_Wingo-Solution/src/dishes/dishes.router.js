const router = require("express").Router();
const controller = require("./dishes.controller");
const methodNotAllowed = require("../errors/methodNotAllowed");

// /dishes
router.route("/").get(controller.list).post(controller.create).all(methodNotAllowed);

// /dishes/:dishId
router.route("/:dishId").get(controller.read).put(controller.update).all(methodNotAllowed);

module.exports = router;

