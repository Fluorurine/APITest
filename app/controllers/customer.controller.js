const MongoUtil = require("../utils/MongoConnection");
const ApiError = require("../utils/api-error");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
//@desc Trả về tất cả các khách hàng trong CSDL\
//route GET /api/customer/
//@access private (Chỉ khi có token cùa admin)
let findAll = async (req, res, next) => {
  try {
    const data = await MongoUtil.getDb("Customer").find({});

    res.json(await data.toArray());
  } catch (e) {
    console.log("Có lỗi với cơ sở dữ liệu người dùng");
    return next(new ApiError(404, "Có lỗi với cơ sở dữ liệu người dùng"));
  }
};
//@desc Tạo người dùng mới trong CSDL hoặc nếu type là update thì cập nhật thông tin người dùng
//route POST /api/customer
//@access public
let createNewUser = async (req, res, next) => {
  if (req.body.username && !/^[a-zA-Z0-9]*$/.test(req.body.username)) {
    // Chống XSS
    return res.json({ err: "Tên người dùng không hợp lệ" });
  }
  if (
    req.body.useremail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.useremail)
  ) {
    return res.json({ err: "Email không hợp lệ" });
  }
  if (req.body.type == "create") {
    if (req.body.password && req.body.password !== req.body.retypepassword) {
      return res.json({ err: "Mật khẩu không trùng khớp" });
    }
    try {
      const userEmailExist = await MongoUtil.getDb("Customer").findOne({
        email: req.body.useremail,
      });
      if (userEmailExist) {
        res.json({
          err: "Email đã dược đăng ký. Vui lòng đăng ký bằng email khác",
        });
      } else {
        const result = await MongoUtil.getDb("Customer").insertOne({
          username: req.body.username,
          email: req.body.useremail,
          password: req.body.password,
          createdAt: Date.now(),
        });
        res.json({ NewId: result.insertedId });
      }
    } catch (e) {
      return next(
        new ApiError(404, "Có lỗi CSDL khi đăng ký tài khoản người dùng.")
      );
    }
  }
  if (req.body.type == "update") {
    //TODO handle logic here Tìm trong token nếu như có người dùng(sau khi decode) thì cập nhật thông tin tương ứng
    try {
      const token = req.cookies.access_token;
      decodedtoken = await jwt.verify(token, "B2111871");
      const result = await MongoUtil.getDb("Customer").updateOne(
        { username: decodedtoken.username },
        {
          $set: {
            username: req.body.username,
            useremail: req.body.useremail,
            password: req.body.password,
            address: req.body.address,
            phonenumber: req.body.phonenumber,
            userimage: req.body.userimage,
          },
        }
      );

      // TODO Đăng xuất ra khi đã đổi thông tin để cập nhật với dữ liệu
      return res.json(result);
    } catch (e) {
      return next(
        new ApiError(404, "Có lỗi khi cập nhật thông tin người dùng")
      );
    }
  }
};
//@desc Xóa tất cả người dungf trong CSDL
//route DELETE /api/customers/
//access private Chỉ có admin có thể thi hành
let deleteAllUser = async (req, res, next) => {
  if (req.query.id) {
    try {
      console.log(req.query.id);
      const result = await MongoUtil.getDb("Customer").deleteOne({
        _id: new ObjectId(req.query.id),
      });

      return res.json(result);
    } catch (e) {
      return next(new ApiError(404, "Có lỗi CSDL khi xóa người dùng bởi id."));
    }
  }
  try {
    const result = await MongoUtil.getDb("Customer").deleteMany({});
    return res.json(result);
  } catch (e) {
    return next(new ApiError(404, "Có lỗi CSDL khi xóa tất cả người dùng."));
  }
};
module.exports = { findAll, createNewUser, deleteAllUser };
