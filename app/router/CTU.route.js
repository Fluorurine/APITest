const router = require("express").Router();
const CTUController = require("../controllers/CTU.controller");
router.get("/", CTUController.findAll);

module.exports = router;
