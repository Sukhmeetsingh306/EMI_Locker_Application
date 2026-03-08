/**
 * Script to find duplicate users (same mobile/email/aadhar/pan under same admin)
 * 
 * Run: node scripts/findDuplicateUsers.js
 */

require('../src/config/env');
const mongoose = require('mongoose');
const connectDatabase = require('../src/config/database');
const logger = require('../src/config/logger');
const ClientUser = require('../src/features/users/models/user.model');

const findDuplicates = async () => {
  try {
    console.log('Connecting to database...');
    await connectDatabase();
    
    const fields = ['mobile', 'email', 'aadhar', 'pan'];
    const allDuplicates = {};
    
    for (const field of fields) {
      console.log(`\nChecking for duplicate ${field} values...`);
      
      const duplicates = await ClientUser.aggregate([
        {
          $match: {
            [field]: { $exists: true, $ne: null, $ne: '' },
            createdBy: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: { createdBy: '$createdBy', [field]: `$${field}` },
            count: { $sum: 1 },
            userIds: { $push: '$_id' },
            userNames: { $push: '$fullName' }
          }
        },
        {
          $match: { count: { $gt: 1 } }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      if (duplicates.length > 0) {
        allDuplicates[field] = duplicates;
        console.log(`  Found ${duplicates.length} duplicate ${field} entries:`);
        duplicates.forEach((dup, idx) => {
          console.log(`    ${idx + 1}. Admin ID: ${dup._id.createdBy}`);
          console.log(`       ${field}: ${dup._id[field]}`);
          console.log(`       Count: ${dup.count}`);
          console.log(`       Users: ${dup.userNames.join(', ')}`);
          console.log(`       User IDs: ${dup.userIds.map(id => id.toString()).join(', ')}`);
        });
      } else {
        console.log(`  ✓ No duplicates found for ${field}`);
      }
    }
    
    const totalDuplicates = Object.values(allDuplicates).reduce((sum, arr) => sum + arr.length, 0);
    
    if (totalDuplicates > 0) {
      console.log(`\n⚠️  Total duplicate groups found: ${totalDuplicates}`);
      console.log('\nTo fix these duplicates, you can:');
      console.log('  1. Delete duplicate user records (keep the oldest one)');
      console.log('  2. Update duplicate field values to be unique');
      console.log('  3. For email (optional field), set to null/empty for duplicates');
    } else {
      console.log('\n✓ No duplicates found! All users are unique per admin.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error finding duplicates:', error);
    logger.error({ err: error }, 'Error finding duplicates');
    process.exit(1);
  }
};

findDuplicates();

