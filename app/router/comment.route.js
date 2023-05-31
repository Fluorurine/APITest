const router = require("express").Router();
const commmentController = require("../controllers/comment.controller");
router.get("/", commmentController.findAll);
router.post("/", commmentController.createNewComment);
router.delete("/", commmentController.deleteAllComment);
module.exports = router;
