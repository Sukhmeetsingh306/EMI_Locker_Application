const { success, failure } = require('../../../core/response');
const razorpayService = require('../services/razorpay.service');
const keyPackageService = require('../../keyPackages/services/keyPackage.service');

// Create Razorpay order for package purchase
exports.createPackageOrder = async (req, res) => {
  try {
    const { packageType } = req.body;
    const adminId = req.user.id;

    if (!packageType) {
      return failure(res, 'Package type is required', 400);
    }

    // Fetch package configs from DB (function is async)
    const configs = await keyPackageService.getPackageConfigs();
    const config = configs[packageType];
    if (!config) {
      return failure(res, 'Invalid package type', 400);
    }

    // Create Razorpay order
    // Razorpay receipt has max length 40; use a short, unique value
    const receipt = `pkg_${String(adminId).slice(-6)}_${Date.now().toString().slice(-6)}`;

    const order = await razorpayService.createOrder(
      config.price,
      'INR',
      receipt
    );

    // Create package purchase record
    const { keyPackage, transaction } = await keyPackageService.createPackagePurchase({
      adminId,
      packageType
    });

    // Update transaction with order ID
    transaction.razorpayOrderId = order.id;
    await transaction.save();

    return success(res, {
      data: {
        order,
        packageId: keyPackage._id
      }
    }, 'Razorpay order created');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// Verify and complete package purchase
exports.verifyPackagePayment = async (req, res) => {
  try {
    const { packageId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return failure(res, 'Payment details are required', 400);
    }

    // Verify payment signature
    const isValid = razorpayService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      return failure(res, 'Invalid payment signature', 400);
    }

    // Complete package purchase
    const keyPackage = await keyPackageService.completePackagePurchase(packageId, {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      approvedBy: req.user.id
    });

    return success(res, { data: keyPackage }, 'Package purchase completed');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};


