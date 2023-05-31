const { MongoClient } = require("mongodb");
let _db;
// Kết nối với CSDL
module.exports = {
  connectToServer: async () => {
    try {
      const client = new MongoClient(
        process.env.MONGODB_URI || "mongodb://127.0.0.1:27017"
      );

      await client.connect();
      _db = client.db("CT449");
    } catch (e) {
      console.error("Có lỗi xảy ra khi kết nối CSDL");
    }
  },
  getDb: (name) => {
    return _db.collection(name);
  },
  close: () => {
    // client.close();
    console.log("Đã đóng data");
  },
};
