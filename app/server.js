const app = require("./app.js");
const config = require("./app/config");
const PORT = config.app.port;
const MongoUtil = require("./app/utils/MongoConnection.js");

async function startServer() {
  try {
    await MongoUtil.connectToServer();
    console.log("Đã kết nối CSDL thành công");
    app.listen(PORT, () => {
      console.log(
        `Server is Running on port ${PORT}`,
        "http://127.0.0.1:3000/"
      );
    });
  } catch (err) {
    console.log("Lỗi");
    process.exit(1);
  }
}
startServer();
