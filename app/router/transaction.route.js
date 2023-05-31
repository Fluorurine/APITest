const router = require("express").Router();
const transactionController = require("../controllers/transaction.controller");
router.get("/", transactionController.findAll);
router.post("/", transactionController.createNewTransaction);
router.delete("/", transactionController.deleteAllTransaction);
module.exports = router;
