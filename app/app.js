const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const ApiError = require("./app/utils/api-error");
const productsRouter = require("./app/router/products.route");
const customersRouter = require("./app/router/customer.route");
const loginRouter = require("./app/router/login.route");
const commentRouter = require("./app/router/comment.route");
const transactionRouter = require("./app/router/transaction.route");
// const testRouter = require("./app/router/testRouter");

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
// app.use("/api/test", testRouter);
app.use("/api/customers", customersRouter);
app.use("/api/products", productsRouter);
app.use("/api/login", loginRouter);
app.use("/api/comment", commentRouter);
app.use("/api/transaction", transactionRouter);
app.get("/", (req, res) => {
  res.json({ message: "This is test from the server" });
});
app.use((req, res, next) => {
  return next(new ApiError(404, "Resource not found"));
});
app.use((err, req, res, next) => {
  res
    .status(err.statusCode || 500)
    .json({ message: err.message || "Internal Server Error" });
});
module.exports = app;
