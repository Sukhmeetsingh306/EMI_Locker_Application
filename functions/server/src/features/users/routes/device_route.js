const express = require("express");
const router = express.Router();
const UserDevice = require("../models/userDevice.model");

router.post("/register-device", async (req, res) => {
    try {
        const { androidId, model, osVersion, fcmToken } = req.body;
        let device = await UserDevice.findOne({ androidId });
        if (!device) {
            device = await UserDevice.create({
            androidId,
            model,
            osVersion,
            fcmToken
            });
        }
        res.json({
            success: true,
            device
        });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
});

module.exports = router;