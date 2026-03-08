// Note: Install aws-sdk: npm install aws-sdk
const AWS = require('aws-sdk');
const crypto = require('crypto');
const path = require('path');

// Configure AWS S3
const s3Config = {};
if (process.env.AWS_ACCESS_KEY_ID) {
  s3Config.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  s3Config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
}
if (process.env.AWS_REGION) {
  s3Config.region = process.env.AWS_REGION;
}

const s3 = new AWS.S3(s3Config);

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} fileName - Original file name
 * @param {String} folder - Folder path in S3 (e.g., 'qr-codes')
 * @returns {Promise<String>} - S3 URL of uploaded file
 */
exports.uploadToS3 = async (fileBuffer, fileName, folder = 'uploads') => {
  if (!BUCKET_NAME) {
    throw new Error('AWS_S3_BUCKET_NAME is not configured');
  }

  // Generate unique file name
  const fileExtension = path.extname(fileName);
  const uniqueFileName = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
  const key = `${folder}/${uniqueFileName}`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: getContentType(fileExtension),
    ACL: 'public-read', // Make file publicly accessible
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location; // Return the public URL
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

/**
 * Delete file from S3
 * @param {String} fileUrl - S3 URL of the file
 * @returns {Promise<void>}
 */
exports.deleteFromS3 = async (fileUrl) => {
  if (!BUCKET_NAME || !fileUrl) {
    return;
  }

  try {
    // Extract key from URL
    const urlParts = fileUrl.split('/');
    const key = urlParts.slice(-2).join('/'); // Get folder/filename

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('S3 delete error:', error);
    // Don't throw error, just log it
  }
};

/**
 * Get content type based on file extension
 */
function getContentType(extension) {
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
}

