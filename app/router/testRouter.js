const router = require("express").Router();
const testcontrollers = require("../controllers/testcontroller");
router.get("/", testcontrollers.findAll);
router.post("/", testcontrollers.add);
router.delete("/", testcontrollers.del);
router.post("/login", testcontrollers.login);
module.exports = router;
