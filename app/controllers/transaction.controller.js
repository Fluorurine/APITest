const MongoUtil = require("../utils/MongoConnection");
const ApiError = require("../utils/api-error");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
//@desc Trả về tất cả các bình luận trong CSDL theo id của sản phẩm
//route GET /api/comment/
//@access public
let findAll = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;
    decodedtoken = await jwt.verify(token, "B2111871");
    if (!decodedtoken) {
      return res.json({ err: "Người dùng chưa đăng nhập" });
    }
    if (decodedtoken.username == "admin") {
      const data = await MongoUtil.getDb("Transaction").find({}).limit(25);

      return res.json(await data.toArray());
    }

    const data = await MongoUtil.getDb("Transaction")
      .find({
        $or: [{ from: decodedtoken.username }, { to: decodedtoken.username }],
      })
      .limit(25);
    res.json(await data.toArray());
  } catch (e) {
    console.log("Không tải được các giao dịch");
    return next(new ApiError(404, "Không tải được giao dịch"));
  }
};
//@desc Tạo bình luận mới trong CSDL tương ứng
//route POST /api/comment
//@access public

let createNewTransaction = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;
    decodedtoken = await jwt.verify(token, "B2111871");
    if (!decodedtoken) {
      return res.json({ err: "Người dùng chưa đăng nhập" });
    }

    // Cập nhật cơ sở dữ liệu để thêm comment mới

    const result = await MongoUtil.getDb("Transaction").insertOne({
      from: decodedtoken.username,
      to: req.body.length >= 2 ? "Nhiều người" : req.body[0].publishBy,
      createdAt: Date.now(),
      data: req.body,
    });
    res.json(result);
  } catch (e) {
    return next(
      new ApiError(404, "Có lỗi CSDL khi đăng ký tài khoản người dùng.")
    );
  }
};
//@desc Xóa tất cả người dungf trong CSDL
//route DELETE /api/customers/
//access private Chỉ có admin có thể thi hành
let deleteAllTransaction = async (req, res, next) => {
  if (req.query.id) {
    console.log(req.query.id);
    const result = await MongoUtil.getDb("Transaction").deleteOne({
      _id: new ObjectId(req.query.id),
    });
    return res.json(result);
  }

  // try {
  //   const result = await MongoUtil.getDb("Transaction").deleteMany({});
  //   res.json(result);
  // } catch (e) {
  //   return next(new ApiError(404, "Có lỗi CSDL khi xóa tất cả người dùng."));
  // }
};
module.exports = { findAll, createNewTransaction, deleteAllTransaction };
