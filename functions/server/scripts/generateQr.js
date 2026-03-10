const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../src/enrollment/enroll.json");

const data = JSON.parse(fs.readFileSync(filePath));

QRCode.toFile(
  path.join(__dirname, "../src/enrollment/enroll.png"),
  JSON.stringify(data),
  function (err) {
    if (err) throw err;
    console.log("Enrollment QR generated!");
  }
);