// Note: Install qrcode: npm install qrcode
const QRCode = require('qrcode');

/**
 * Generate QR code data URL from UPI ID
 * @param {String} upiId - UPI ID (e.g., user@paytm, 1234567890@ybl)
 * @param {Number} amount - Amount (optional, for dynamic QR)
 * @param {Object} options - QR code options
 * @returns {Promise<String>} - Data URL of the QR code image
 */
exports.generateUPIQRCode = async (upiId, amount = null, options = {}) => {
  if (!upiId) {
    throw new Error('UPI ID is required');
  }

  // Format UPI ID for QR code (UPI format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR)
  let upiString = `upi://pay?pa=${encodeURIComponent(upiId)}`;
  
  // Add amount if provided
  if (amount && amount > 0) {
    upiString += `&am=${amount.toFixed(2)}&cu=INR`;
  }

  const defaultOptions = {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    quality: 0.92,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    width: 300,
  };

  const qrOptions = { ...defaultOptions, ...options };

  try {
    // Generate QR code as data URL
    const dataUrl = await QRCode.toDataURL(upiString, qrOptions);
    return dataUrl;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate QR code buffer (for saving to file or S3)
 * @param {String} upiId - UPI ID
 * @param {Object} options - QR code options
 * @returns {Promise<Buffer>} - Buffer of the QR code image
 */
exports.generateUPIQRCodeBuffer = async (upiId, options = {}) => {
  if (!upiId) {
    throw new Error('UPI ID is required');
  }

  const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}`;

  const defaultOptions = {
    errorCorrectionLevel: 'M',
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    width: 300,
  };

  const qrOptions = { ...defaultOptions, ...options };

  try {
    const buffer = await QRCode.toBuffer(upiString, qrOptions);
    return buffer;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

