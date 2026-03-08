const crypto = require('crypto');

/**
 * Generate a user key in format: {adminFirstName}_{userFirstName}_{5RandomDigits}
 * @param {String} adminFirstName - Admin's first name
 * @param {String} userFirstName - User's first name
 * @returns {String} Generated key string
 */
const generateUserKey = (adminFirstName, userFirstName) => {
  // Clean names: remove spaces, special chars, convert to lowercase
  const cleanAdminName = (adminFirstName || 'ADMIN').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const cleanUserName = (userFirstName || 'USER').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Generate 5 random digits
  const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
  
  return `${cleanAdminName}_${cleanUserName}_${randomDigits}`;
};

/**
 * Generate a user key in old format (for backward compatibility)
 * Format: EMLK-{timestamp}-{randomHex}
 * @returns {String} Unique key string
 */
const generateUserKeyLegacy = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `EMLK-${timestamp}-${randomPart}`;
};

/**
 * Generate a unique user key and ensure it doesn't exist in the database
 * @param {String} adminFirstName - Admin's first name
 * @param {String} userFirstName - User's first name
 * @param {Model} UserKeyModel - The UserKey model to check for uniqueness
 * @returns {Promise<String>} Unique key string
 */
const generateUniqueUserKey = async (adminFirstName, userFirstName, UserKeyModel) => {
  let key;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    // Generate key with new random digits if previous attempt failed
    if (attempts > 0) {
      key = generateUserKey(adminFirstName, userFirstName);
    } else {
      key = generateUserKey(adminFirstName, userFirstName);
    }
    
    const existingKey = await UserKeyModel.findOne({ userKey: key });
    
    if (!existingKey) {
      isUnique = true;
    } else {
      attempts++;
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique key after multiple attempts');
  }

  return key;
};

/**
 * Validate and use provided key, or generate a new one if not provided
 * @param {String} providedKey - Key provided by frontend (optional)
 * @param {String} adminFirstName - Admin's first name (for generation)
 * @param {String} userFirstName - User's first name (for generation)
 * @param {Model} UserKeyModel - The UserKey model to check for uniqueness
 * @returns {Promise<String>} Valid unique key string
 */
const validateOrGenerateKey = async (providedKey, adminFirstName, userFirstName, UserKeyModel) => {
  // If key is provided, validate it's unique
  if (providedKey) {
    const existingKey = await UserKeyModel.findOne({ userKey: providedKey });
    if (existingKey) {
      throw new Error('Provided key already exists. Please try again.');
    }
    return providedKey;
  }
  
  // Otherwise generate a new one
  return generateUniqueUserKey(adminFirstName, userFirstName, UserKeyModel);
};

/**
 * Generate an EMI key in format: EMI-{billNumber}-{5RandomDigits}
 * @param {String} billNumber - Bill number for the EMI
 * @returns {String} Generated key string
 */
const generateEmiKey = (billNumber) => {
  // Clean bill number: remove spaces, special chars
  const cleanBillNumber = (billNumber || 'BILL').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Generate 5 random digits
  const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
  
  return `EMI-${cleanBillNumber}-${randomDigits}`;
};

/**
 * Generate a unique EMI key and ensure it doesn't exist in the database
 * @param {String} billNumber - Bill number for the EMI
 * @param {Model} EmiModel - The EMI model to check for uniqueness
 * @returns {Promise<String>} Unique key string
 */
const generateUniqueEmiKey = async (billNumber, EmiModel) => {
  let key;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    key = generateEmiKey(billNumber);
    
    const existingEmi = await EmiModel.findOne({ emiKey: key });
    
    if (!existingEmi) {
      isUnique = true;
    } else {
      attempts++;
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique EMI key after multiple attempts');
  }

  return key;
};

module.exports = {
  generateUserKey,
  generateUserKeyLegacy,
  generateUniqueUserKey,
  validateOrGenerateKey,
  generateEmiKey,
  generateUniqueEmiKey,
};

