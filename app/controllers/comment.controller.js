const MongoUtil = require("../utils/MongoConnection");
const ApiError = require("../utils/api-error");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
//@desc Trả về tất cả các bình luận trong CSDL theo id của sản phẩm
//route GET /api/comment/
//@access public
let findAll = async (req, res, next) => {
  if (!req.query.id) {
    return res.json({ err: "Không có dữ liệu theo yêu cầu" });
  }
  try {
    const data = await MongoUtil.getDb("Comment").find({
      product_id: req.query.id,
    });

    res.json(await data.toArray());
  } catch (e) {
    console.log("Không tải được bình luận");
    return next(new ApiError(404, "Không tải được bình luận"));
  }
};
//@desc Tạo bình luận mới trong CSDL tương ứng
//route POST /api/comment
//@access public
let createNewComment = async (req, res, next) => {
  if (!req.body.reviewdata) {
    // Chống XSS
    return res.json({ err: "Không có nội dung bình luận" });
  }

  try {
    const token = req.cookies.access_token;
    let decodedtoken = await jwt.verify(token, "B2111871");
    if (!decodedtoken) {
      return res.json({ err: "Người dùng chưa đăng nhập" });
    }
    const userdata = await MongoUtil.getDb("Customer").findOne({
      username: decodedtoken.username,
    });
    let userimage;
    if (!userdata.userimage) {
      userimage = "\\upload\\blank_picture.png";
    } else {
      userimage = userdata.userimage;
    }
    const test = await MongoUtil.getDb("Products").updateOne(
      { _id: new ObjectId(req.body.productId) },
      {
        $inc: { reviewcount: 1, totalstar: parseInt(req.body.star) },
      }
    );
    console.log(test);

    // Cập nhật cơ sở dữ liệu để thêm comment mới
    const result = await MongoUtil.getDb("Comment").insertOne({
      username: decodedtoken.username,
      userimage: userimage,
      reviewdata: req.body.reviewdata,
      product_id: req.body.productId,
      star: req.body.star,
      createdAt: Date.now(),
    });
    res.json({ NewId: result.insertedId });
  } catch (e) {
    return next(
      new ApiError(404, "Có lỗi CSDL khi đăng ký tài khoản người dùng.")
    );
  }
};
//@desc Xóa tất cả người dungf trong CSDL
//route DELETE /api/customers/
//access private Chỉ có admin có thể thi hành
let deleteAllComment = async (req, res, next) => {
  try {
    const result = await MongoUtil.getDb("Customer").deleteMany({});
    res.json(result);
  } catch (e) {
    return next(new ApiError(404, "Có lỗi CSDL khi xóa tất cả người dùng."));
  }
};
module.exports = { findAll, createNewComment, deleteAllComment };
