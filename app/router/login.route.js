const router = require("express").Router();
const loginController = require("../controllers/login.controller");
router.get("/", loginController.getLoginInfo);
router.post("/", loginController.login);
router.get("/logout", loginController.logout);
module.exports = router;
