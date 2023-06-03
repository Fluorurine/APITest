const MongoUtil = require("../utils/MongoConnection");

require("dotenv").config();
const ApiError = require("../utils/api-error");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const axios = require("axios").default;
const { JSDOM } = require("jsdom");
const fs = require("fs");
const { clearScreenDown } = require("readline");
//@desc Trả về cái mà khi submit from lên nó nên gửi về
//route GET /api/
//@access public
let findAll = async (req, res, next) => {
  const txtDinhDanh = "B2111871";
  const txtMatKhau = "mc#aB#SQ";
  const getCookie = async () => {
    let data = req.cookies.mycookie || {};
    if (
      !req.cookies.mycookie ||
      !req.cookies.mycookie.COOKIEDATA ||
      (new Date().getTime() - req.cookies.mycookie.LAST) / (1000 * 60) > 15
    ) {
      const Cookietmp = await axios.postForm(
        "https://qldt.ctu.edu.vn/htql/sinhvien/dang_nhap.php",
        {
          txtDinhDanh,
          txtMatKhau,
        }
      );
      console.log("Đã lấy Cookie");
      data.COOKIEDATA = Cookietmp.headers["set-cookie"];
      data.LAST = new Date().getTime();
    }
    res.cookie("mycookie", data);
    return data.COOKIEDATA;
  };

  try {
    // if (cookieTemp) return cookieTemp;
    // Lấy Cookie từ phía CLient lên

    // Bắt đầu sau khi đã đăng nhập thì trả về cái cần trả về thôi
    const cmbHocKy = req.query.hk || "3";
    const cmbNamHoc = "2023";
    const txtMaMH = req.query.ma || "ML019";
    let cookie = await getCookie();

    // Ở đây lưu ý rằng có Cookie đăng nhập để tạo session xong rồi mới trở về vào lại hệ thống nha.
    const data = await axios.postForm(
      "https://qldt.ctu.edu.vn/htql/dkmh/student/dang_nhap.php",
      {
        txtDinhDanh,
        txtMatKhau: "p",
      },
      {
        headers: {
          cookie,
        },
      }
    );

    console.log(
      "Log: " +
        new Date().getTime() +
        "\nCookie hiện tại:" +
        JSON.stringify(req.cookies.mycookie)
    );

    const formdata = await axios.postForm(
      "https://qldt.ctu.edu.vn/htql/dkmh/student/index.php?action=dmuc_mhoc_hky",
      { cmbHocKy, cmbNamHoc, txtMaMH },
      {
        headers: {
          cookie,
        },
      }
    );
    // fs.appendFile("output.txt", formdata.data, (err) => {
    //   if (err) throw err;
    //   console.log("Data appended to file");
    // });
    // console.log(formdata.data);
    const {
      window: { document },
    } = new JSDOM(formdata.data);

    // Sau khi đã có data trả về từ JSDOM

    let tds;
    let preprocessJSON = [];

    document
      .querySelectorAll("table")[5]
      .querySelector("tbody")
      .querySelectorAll("tr")
      .forEach((tr, index) => {
        if (index === 0) return;
        tds = tr.querySelectorAll("td");
        let name = tds[1].textContent.trim();
        if (
          preprocessJSON[0] &&
          preprocessJSON[preprocessJSON.length - 1].group == name
        ) {
          preprocessJSON[preprocessJSON.length - 1].time.push({
            room: tds[5].textContent.trim(),
            day: parseInt(tds[2].textContent),
            count: parseInt(tds[3].textContent),
            start: parseInt(tds[4].textContent),
          });
          return;
        }

        preprocessJSON.push({
          group: name,
          avaiable: parseInt(tds[6].textContent),
          remain: parseInt(tds[7].textContent),
          week: tds[8].textContent.trim(),
          time: [
            {
              room: tds[5].textContent.trim(),
              day: parseInt(tds[2].textContent),
              count: parseInt(tds[3].textContent),
              start: parseInt(tds[4].textContent),
            },
          ],
        });
      });

    return res.status(200).json(preprocessJSON);
  } catch (e) {
    console.log("Không tải được bình luận");
    return next(new ApiError(404, "Không tải được bình luận"));
  }
};

module.exports = { findAll };
