const router = require("express").Router();
const customerController = require("../controllers/customer.controller");
router.get("/", customerController.findAll);
router.post("/", customerController.createNewUser);
router.delete("/", customerController.deleteAllUser);
module.exports = router;
