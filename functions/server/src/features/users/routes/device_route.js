const express = require("express");
const router = express.Router();
const UserDevice = require("../models/userDevice.model");

router.post("/register-device", async (req, res) => {
  try {
    const { deviceId, model, osVersion, fcmToken } = req.body;

    const device = await UserDevice.create({
      deviceId,
      model,
      osVersion,
      fcmToken,
      deviceLocked: false
    });

    res.json({
      success: true,
      message: "Device registered",
      data: device
    });

  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
});

module.exports = router;