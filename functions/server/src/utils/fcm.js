/**
 * FCM Service - Node.js Implementation
 * Complete implementation for sending FCM messages
 * Matches Flutter developer's API structure
 */

const admin = require('firebase-admin');
const logger = require('../config/logger');

// Initialize Firebase Admin if not already initialized
let firebaseInitialized = false;
let messaging = null;

const initializeFirebase = () => {
  if (firebaseInitialized) {
    return;
  }

  try {
    // Check if Firebase is already initialized
    if (admin.apps.length === 0) {
      const serviceAccount = process.env.FCM_SERVICE_ACCOUNT || null;
      
      if (!serviceAccount) {
        logger.warn('FCM_SERVICE_ACCOUNT not found. FCM notifications will be disabled.');
        firebaseInitialized = false;
        return;
      }

      let serviceAccountJson;
      try {
        // Try to parse as JSON string (for environment variable)
        serviceAccountJson = JSON.parse(serviceAccount);
      } catch (e) {
        // If parsing fails, it might be a file path
        logger.error('FCM_SERVICE_ACCOUNT must be a valid JSON string');
        firebaseInitialized = false;
        return;
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountJson),
      });

      messaging = admin.messaging();
      firebaseInitialized = true;
      logger.info('Firebase Admin initialized successfully');
    } else {
      messaging = admin.messaging();
      firebaseInitialized = true;
    }
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize Firebase Admin');
    firebaseInitialized = false;
    // Don't throw error, just log it so the app can continue without FCM
  }
};

class FCMService {
  /**
   * Send lock command to device
   * @param {String} userId - User ID
   * @param {Object} lockData - Lock command data
   * @returns {Promise<Object>}
   */
  async sendLockCommand(userId, lockData) {
    try {
      if (!firebaseInitialized) {
        initializeFirebase();
      }

      if (!firebaseInitialized || !messaging) {
        logger.warn('Firebase not initialized. Skipping lock command.');
        throw new Error('Firebase not initialized');
      }

      const fcmToken = lockData.fcmToken;

      if (!fcmToken) {
        throw new Error('FCM token not found for user');
      }

      const message = {
        token: fcmToken,
        data: {
          type: 'lock_command',
          emiId: lockData.emiId || '',
          reason: lockData.reason || 'EMI overdue',
          overdueAmount: String(lockData.overdueAmount || 0),
          loanNumber: lockData.loanNumber || '',
          borrowerName: lockData.borrowerName || '',
          userId: String(userId),
          timestamp: new Date().toISOString(),
        },
        android: {
          priority: 'high',
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              contentAvailable: 1,
            },
          },
        },
      };

      // Send message
      const response = await messaging.send(message);
      
      logger.info(
        { userId, messageId: response, fcmToken: fcmToken.substring(0, 20) + '...' },
        'Lock command sent successfully'
      );

      return {
        success: true,
        messageId: response,
        sentAt: new Date(),
      };
    } catch (error) {
      logger.error({ err: error, userId }, 'Error sending lock command');
      
      // Handle invalid token errors
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        return { 
          success: false, 
          error: 'Invalid or unregistered token', 
          shouldRemoveToken: true 
        };
      }
      
      throw error;
    }
  }

  /**
   * Send unlock command to device
   * @param {String} userId - User ID
   * @param {Object} unlockData - Unlock command data
   * @returns {Promise<Object>}
   */
  async sendUnlockCommand(userId, unlockData) {
    try {
      if (!firebaseInitialized) {
        initializeFirebase();
      }

      if (!firebaseInitialized || !messaging) {
        logger.warn('Firebase not initialized. Skipping unlock command.');
        throw new Error('Firebase not initialized');
      }

      const fcmToken = unlockData.fcmToken;

      if (!fcmToken) {
        throw new Error('FCM token not found for user');
      }

      const message = {
        token: fcmToken,
        data: {
          type: 'unlock_command',
          reason: unlockData.reason || 'Payment received',
          timestamp: new Date().toISOString(),
        },
        android: {
          priority: 'high',
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              contentAvailable: 1,
            },
          },
        },
      };

      const response = await messaging.send(message);
      
      logger.info(
        { userId, messageId: response, fcmToken: fcmToken.substring(0, 20) + '...' },
        'Unlock command sent successfully'
      );

      return {
        success: true,
        messageId: response,
        sentAt: new Date(),
      };
    } catch (error) {
      logger.error({ err: error, userId }, 'Error sending unlock command');
      
      // Handle invalid token errors
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        return { 
          success: false, 
          error: 'Invalid or unregistered token', 
          shouldRemoveToken: true 
        };
      }
      
      throw error;
    }
  }

  /**
   * Send extend payment command
   * @param {String} userId - User ID
   * @param {Number} days - Number of days to extend
   * @param {String} reason - Reason for extension
   * @param {String} fcmToken - FCM token (optional, will be fetched if not provided)
   * @returns {Promise<Object>}
   */
  async sendExtendPayment(userId, days, reason, fcmToken = null) {
    try {
      if (!firebaseInitialized) {
        initializeFirebase();
      }

      if (!firebaseInitialized || !messaging) {
        logger.warn('Firebase not initialized. Skipping extend payment command.');
        throw new Error('Firebase not initialized');
      }

      if (!fcmToken) {
        throw new Error('FCM token not found for user');
      }

      const unlockUntil = new Date();
      unlockUntil.setDate(unlockUntil.getDate() + days);

      const message = {
        token: fcmToken,
        data: {
          type: 'extend_payment',
          days: String(days),
          reason: reason || 'Payment extension granted',
          timestamp: new Date().toISOString(),
        },
        android: {
          priority: 'high',
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              contentAvailable: 1,
            },
          },
        },
      };

      const response = await messaging.send(message);
      
      logger.info(
        { userId, messageId: response, days, fcmToken: fcmToken.substring(0, 20) + '...' },
        'Extend payment sent successfully'
      );

      return {
        success: true,
        messageId: response,
        unlockUntil: unlockUntil,
        sentAt: new Date(),
      };
    } catch (error) {
      logger.error({ err: error, userId }, 'Error sending extend payment');
      
      // Handle invalid token errors
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        return { 
          success: false, 
          error: 'Invalid or unregistered token', 
          shouldRemoveToken: true 
        };
      }
      
      throw error;
    }
  }
}

// Initialize on module load
initializeFirebase();

// Export singleton instance
const fcmService = new FCMService();

// Add initializeFirebase method to the instance
fcmService.initializeFirebase = initializeFirebase;

module.exports = fcmService;
module.exports.FCMService = FCMService;
module.exports.initializeFirebase = initializeFirebase;
