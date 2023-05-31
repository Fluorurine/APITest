const MongoUtil = require("../utils/MongoConnection");
const ApiError = require("../utils/api-error");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

//@desc Return trả về hết tất cả các products có sẵn
//@route GET /api/products
//access public
let findAll = async (req, res) => {
  try {
    //MongoDB Service
    const data = await MongoUtil.getDb("Products").find({});

    res.json(await data.toArray());
  } catch (e) {
    console.log("Có lỗi với cơ sở dữ liệu sản phẩm");
    return next(new ApiError(404, "Có lỗi với cơ sở dữ liệu sản phẩm"));
  }
};

//@desc Trả về thông tin của sản phẩm theo id
//@route GET /api/products/user
//access public
let findByUserId = async (req, res, next) => {
  let decodedtoken;
  try {
    const token = req.cookies.access_token;
    decodedtoken = await jwt.verify(token, "B2111871");
  } catch (e) {
    return res.json({ err: "Lỗi đăng nhập: " + e.name });
  }
  if (!decodedtoken) {
    return res.json({ err: "Vui lòng đăng nhập để tiếp tục" });
  }

  try {
    //MongoDB Service
    const data = await (
      await MongoUtil.getDb("Products").find({
        publishBy: decodedtoken.username,
      })
    ).toArray();

    res.json(data);
  } catch (e) {
    return next(new ApiError(404, "Có lỗi tìm kiếm theo tên người dùng"));
  }
};
//@desc Trả về thông tin của sản phẩm theo id của người dùng
//@route GET /apo/product/user  detail ???
//access private
let findById = async (req, res, next) => {
  console.log(req.query.Id);
  if (!ObjectId.isValid(req.query.Id)) {
    return res.json({ err: "Id không hợp lệ" });
  }
  try {
    //MongoDB Service
    const data = await MongoUtil.getDb("Products").findOne({
      _id: new ObjectId(req.query.Id),
    });
    res.json(data);
  } catch (e) {
    return next(new ApiError(404, "Có lỗi tìm kiếm bằng Id"));
  }
};
//@desc Trả về 5 element theo name của products cho search
//@route GET /api/products/name
//access public
let findByName = async (req, res, next) => {
  try {
    //MongoDB Service
    const data = await MongoUtil.getDb("Products")
      .find({
        productname: { $regex: req.query.text, $options: "i" },
      })
      .limit(5);
    res.json(await data.toArray());
  } catch (e) {
    console.log("Có lối khi tìm kiếm dữ liệu");
    return next(new ApiError(404, "Lỗi khi tìm kiếm"));
  }
};
//@desc Trả về thông tin của mảng theo array data được post lên
//@route POST /api/products/detail
//access public
let findByArray = async (req, res, next) => {
  const resultarray = [];
  try {
    //MongoDB Service
    for (let i = 0; i < req.body.length; i++) {
      const data = await MongoUtil.getDb("Products").findOne(
        {
          _id: new ObjectId(req.body[i].productId),
        },
        {
          projection: {
            _id: 1,
            productname: 1,
            productimage: 1,
            productminprice: 1,
            productsell: 1,
          },
        }
      );
      resultarray.push(data);
    }

    res.json(resultarray);
  } catch (e) {
    console.log("Có lỗi khi tìm thông tin trong giỏ hàng");
    return next(new ApiError(404, "Có lỗi tìm kiếm bằng Id"));
  }
};
//@desc Tạo sản phẩm mới để lưu vào trong CSDL
//@route POST /api/products
//access private ( Chỉ có người dùng có token hợp lệ có thể truy cập vào product)
let createNewProduct = async (req, res, next) => {
  //Kiểm tra xem có người dùng đã đăng nhập chưa
  let variant;
  let decodedtoken;
  let productminprice;
  variant = req.body.productvariant;
  try {
    const token = req.cookies.access_token;
    decodedtoken = await jwt.verify(token, "B2111871");
  } catch (e) {
    return res.json({ err: "Lỗi đăng nhập: " + e.name });
  }
  if (!decodedtoken) {
    return res.json({ err: "Vui lòng đăng nhập để tiếp tục" });
  }

  if (
    !req.body.productname ||
    !req.body.productcategory ||
    !req.body.productdescription ||
    !req.body.productvariant ||
    !req.body.productimage ||
    !req.body.flag
  ) {
    return res.json({ err: "Thông tin sản phẩm còn thiếu" });
  }
  if (
    !/^[a-zA-Z0-9\s\n]*$/.test(req.body.productname) ||
    !/^[a-zA-Z0-9\s\n]*$/.test(req.body.productcategory)
  ) {
    return res.json({ err: "Dữ liệu không được chứa kí tự đặc biệt" });
  }
  productminprice = req.body.productvariant[0];
  // Nếu flag là created thì cập nhật dữ liệu

  for (let i = 0; i < req.body.productvariant.length; i++) {
    if (
      !Number.isInteger(parseInt(req.body.productvariant[i].variantprice)) ||
      !Number.isInteger(parseInt(req.body.productvariant[i].variantcount))
    ) {
      return res.json({ err: "Kiểm tra lại trường thể loại" });
    }
    if (parseInt(req.body.productvariant[i].variantprice <= 0)) {
      return res.json({ err: "Giá cả mặt hàng chưa hợp lệ" });
    }
    if (productminprice > req.body.productvariant[i].variantprice) {
      productminprice = req.body.productvariant[i].variantprice;
    }

    // Nếu chưa có thuộc tính thì thêm vào nễu có rồi thì thối vẫn giữ số lượng đã bán
    if (!variant[i].variantremain) {
      variant[i] = {
        ...variant[i],
        variantremain: variant[i].variantcount,
      };
    }
  }
  if (req.body.flag == "create") {
    //MongoDB Service
    try {
      const productExist = await MongoUtil.getDb("Products").findOne({
        name: req.body.productname,
      });
      if (productExist) {
        res.json({
          err: "Sản phẩm đã tồn tại trên hệ thống vui lòng đổi sản phẩm khác",
        });
      } else {
        const result = await MongoUtil.getDb("Products").insertOne({
          productname: req.body.productname,
          productsell: 0,
          productminprice: parseInt(productminprice),
          productcategory: req.body.productcategory,
          productdescription: req.body.productdescription,
          productvariant: variant,
          productimage: req.body.productimage,
          createdAt: Date.now(),
          editedAt: Date.now(),
          publishBy: decodedtoken.username,
          reviewcount: 0,
          totalstar: 0,
        });

        return res.json({ NewId: result.insertedId });
      }
    } catch (e) {
      return next(new ApiError(404, "Có lỗi CSDL khi tạo sản phẩm mới."));
    }
  }
  // Nếu flag là update thì cập nhật lại CSDL
  if (req.body.flag == "update") {
    try {
      console.log(req.body.productId);
      const test = await MongoUtil.getDb("Products").findOne({
        _id: new ObjectId(req.body.productId),
      });
      console.log(test);
      //Chỉ có admin và chủ sở hữu có quyền update theo yêu cầu
      let flag = 1;
      if (!(test.publishBy == decodedtoken.username)) {
        flag = 0;
      }
      if (decodedtoken.username == "admin") {
        flag = 1;
      }
      if (flag == 0) {
        return res.json({ err: "Người dùng không hợp lệ" });
      }

      const result = await MongoUtil.getDb("Products").updateOne(
        { _id: new ObjectId(req.body.productId) },
        {
          $set: {
            productname: req.body.productname,
            productsell: 0,
            productminprice: parseInt(productminprice),
            productcategory: req.body.productcategory,
            productdescription: req.body.productdescription,
            productvariant: variant,
            productimage: req.body.productimage,
            editedAt: Date.now(),
            publishBy: decodedtoken.username,
          },
        }
      );
      console.log(result);
      return res.json(result);
    } catch (e) {
      return next(new ApiError(404, "Các trục khác khác khác"));
    }
  }
};

//@desc Xóa một hoặc nhiều sản phẩm trong CSDL tùy thuộc vào có query params hay không
//@route DELETE /api/products
//access private ( Chỉ có người dùng có token hợp lệ có thể truy cập vào product)
let deleteAll = async (req, res, next) => {
  if (req.query.Id) {
    try {
      //MongoDB Service
      const result = await MongoUtil.getDb("Products").deleteOne({
        _id: new ObjectId(req.query.Id),
      });

      return res.json(result);
    } catch (e) {
      return next(new ApiError(404, "Có lỗi CSDL khi xóa tất cả sản phẩm."));
    }
  }

  try {
    //MongoDB Service
    const result = await MongoUtil.getDb("Products").deleteMany({});

    res.json(result);
  } catch (e) {
    return next(new ApiError(404, "Có lỗi CSDL khi xóa tất cả sản phẩm."));
  }
};

//@desc Tìm kiếm theo danh mục cho trước
//@route GET /apo/products/category/
//access public
let findCategory = async (req, res, next) => {
  if (
    !req.query.categoryId ||
    req.query.categoryId === "undefined" ||
    !req.query.lastId ||
    !req.query.sortType
  ) {
    return res.json({
      err: "Có lỗi khi tìm dữ liệu 1",
    });
  }
  //last id = 0 thì đầu nếu có rồi thì fetch theo từng trường hợp của sort
  if (
    !ObjectId.isValid(req.query.lastId) &&
    !Number.isInteger(parseInt(req.query.lastId))
  ) {
    {
      console.log(
        !ObjectId.isValid(req.query.lastId),
        !Number.isInteger(parseInt(req.query.lastId))
      );
      return res.json({
        err: "Có lỗi khi tìm dữ liệu 2",
      });
    }
  }
  try {
    switch (parseInt(req.query.sortType)) {
      //Sort theo mới nhất
      case 1:
        if (req.query.lastId == 0) {
          console.log(
            await (
              await MongoUtil.getDb("Products")
                .find(
                  { productcategory: req.query.categoryId },
                  {
                    projection: {
                      _id: 1,
                      productname: 1,
                      productimage: 1,
                      productminprice: 1,
                      productsell: 1,
                    },
                  }
                )
                .sort({ _id: -1 })
                .limit(12)
            ).toArray()
          );
          return res.json(
            await (
              await MongoUtil.getDb("Products")
                .find(
                  { productcategory: req.query.categoryId },
                  {
                    projection: {
                      _id: 1,
                      productname: 1,
                      productimage: 1,
                      productminprice: 1,
                      productsell: 1,
                    },
                  }
                )
                .sort({ _id: -1 })
                .limit(12)
            ).toArray()
          );
        }
        console.log("TH2");

        return res.json(
          await (
            await MongoUtil.getDb("Products")
              .find(
                {
                  _id: { $lt: new ObjectId(req.query.lastId) },
                  productcategory: req.query.categoryId,
                },
                {
                  projection: {
                    _id: 1,
                    productname: 1,
                    productimage: 1,
                    productminprice: 1,
                    productsell: 1,
                  },
                }
              )
              .sort({ _id: -1 })
              .limit(12)
          ).toArray()
        );
      //Sort theo cũ nhất
      case 2:
        if (req.query.lastId == 0) {
          return res.json(
            await (
              await MongoUtil.getDb("Products")
                .find(
                  { productcategory: req.query.categoryId },
                  {
                    projection: {
                      _id: 1,
                      productname: 1,
                      productimage: 1,
                      productminprice: 1,
                      productsell: 1,
                    },
                  }
                )
                .limit(12)
            ).toArray()
          );
        }
        return res.json(
          await (
            await MongoUtil.getDb("Products")
              .find(
                {
                  _id: { $gt: new ObjectId(req.query.lastId) },
                  productcategory: req.query.categoryId,
                },
                {
                  projection: {
                    _id: 1,
                    productname: 1,
                    productimage: 1,
                    productminprice: 1,
                    productsell: 1,
                  },
                }
              )
              .limit(12)
          ).toArray()
        );
      case 3:
        if (req.query.lastId == 0) {
          return res.json(
            await (
              await MongoUtil.getDb("Products")
                .find(
                  { productcategory: req.query.categoryId },
                  {
                    projection: {
                      _id: 1,
                      productname: 1,
                      productimage: 1,
                      productminprice: 1,
                      productsell: 1,
                    },
                  }
                )
                .sort({ price: 1 })
                .limit(12)
            ).toArray()
          );
        }
        return res.json(
          await (
            await MongoUtil.getDb("Products")
              .find(
                {
                  productminprice: { $gt: req.query.lastId },
                  productcategory: req.query.categoryId,
                },
                {
                  projection: {
                    _id: 1,
                    productname: 1,
                    productimage: 1,
                    productminprice: 1,
                    productsell: 1,
                  },
                }
              )
              .sort({ price: 1 })
              .limit(12)
          ).toArray()
        );
      case 4:
        if (req.query.lastId == 0) {
          return res.json(
            await (
              await MongoUtil.getDb("Products")
                .find(
                  { productcategory: req.query.categoryId },
                  {
                    projection: {
                      _id: 1,
                      productname: 1,
                      productimage: 1,
                      productminprice: 1,
                      productsell: 1,
                    },
                  }
                )
                .sort({ price: -1 })
                .limit(12)
            ).toArray()
          );
        }
        return res.json(
          await (
            await MongoUtil.getDb("Products")
              .find(
                {
                  productminprice: { $lt: req.query.lastId },
                  productcategory: req.query.categoryId,
                },
                {
                  projection: {
                    _id: 1,
                    productname: 1,
                    productimage: 1,
                    productminprice: 1,
                    productsell: 1,
                  },
                }
              )
              .sort({ price: -1 })
              .limit(12)
          ).toArray()
        );
      default:
        return res.json({
          err: "Không tồn tại trường hợp sort này",
        });
    }
  } catch (e) {
    return res.json({
      err: "Có lỗi khi tìm dữ liệu 3",
    });
  }
};

module.exports = {
  findAll,
  createNewProduct,
  deleteAll,
  findCategory,
  findById,
  findByArray,
  findByUserId,
  findByName,
};
