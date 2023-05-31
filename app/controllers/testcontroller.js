const TestModel = require("../models/TestModel");
const jwt = require("jsonwebtoken");
let findAll = async (req, res) => {
  let result = await TestModel.find();
  res.json(result);
};
let add = async (req, res) => {
  console.log(req.body);
  const result = await TestModel.create(req.body);
  console.log(result);
  result.save();
  res.json(result);
};
const del = async (req, res) => {
  const result = await TestModel.deleteMany({});
  res.json(result);
};
let login = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  var accesstoken =
    //  = jwt.sign({ foo: "bar" }, "privateKey");
    jwt.sign(
      { email, password },
      "testkey",
      {
        expiresIn: "1m",
      }
      // (err, token) => {
      //   console.log(token);
      // }
    );
  console.log("This is token");
  console.log(accesstoken);
  console.log("then");
  let decoded;
  jwt.verify(accesstoken, "testkey", (err, decoded2) => {
    console.log("Hello");
    err && console.log(err.message);
    console.log(decoded2);
    decoded = decoded2;
  });
  console.log("+Decoded la");
  console.log(decoded);
  for (let i = 0; i < 10; i++) {
    console.log(decoded);
  }
  res.json(decoded);
};

module.exports = { findAll, add, del, login };
