/**
 * Migration script to update User model indexes
 * Drops old unique indexes and creates new compound indexes
 * 
 * Run this script once: node scripts/migrateUserIndexes.js
 */

require('../src/config/env');
const mongoose = require('mongoose');
const connectDatabase = require('../src/config/database');
const logger = require('../src/config/logger');

const runMigration = async () => {
  try {
    console.log('Connecting to database...');
    logger.info('Connecting to database...');
    await connectDatabase();
    
    const db = mongoose.connection.db;
    const collection = db.collection('clientusers');
    
    console.log('Dropping old unique indexes...');
    logger.info('Dropping old unique indexes...');
    
    // Drop old unique indexes if they exist
    const indexesToDrop = ['aadhar_1', 'pan_1', 'mobile_1', 'email_1'];
    
    for (const indexName of indexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`✓ Dropped index: ${indexName}`);
        logger.info(`✓ Dropped index: ${indexName}`);
      } catch (err) {
        if (err.code === 27 || err.message.includes('index not found')) {
          console.log(`- Index ${indexName} does not exist, skipping...`);
          logger.info(`- Index ${indexName} does not exist, skipping...`);
        } else {
          console.error(`✗ Error dropping index ${indexName}:`, err.message);
          logger.error({ err }, `✗ Error dropping index ${indexName}`);
        }
      }
    }
    
    console.log('\nCreating new compound indexes...');
    logger.info('Creating new compound indexes...');
    
    // Create new compound indexes
    const indexesToCreate = [
      { createdBy: 1, mobile: 1 },
      { createdBy: 1, aadhar: 1 },
      { createdBy: 1, pan: 1 },
      { createdBy: 1, email: 1 }
    ];
    
    for (const indexSpec of indexesToCreate) {
      try {
        const indexName = Object.keys(indexSpec).join('_') + '_1';
        const isSparse = indexSpec.email === 1;
        
        await collection.createIndex(indexSpec, { 
          unique: true,
          sparse: isSparse,
          name: indexName
        });
        console.log(`✓ Created index: ${indexName}${isSparse ? ' (sparse)' : ''}`);
        logger.info(`✓ Created index: ${indexName}${isSparse ? ' (sparse)' : ''}`);
      } catch (err) {
        if (err.code === 85 || err.message.includes('already exists')) {
          console.log(`- Index already exists, skipping...`);
          logger.info(`- Index already exists, skipping...`);
        } else if (err.code === 11000 || err.codeName === 'DuplicateKey') {
          // Duplicate key error - find and report duplicates
          const fieldName = Object.keys(indexSpec).find(k => k !== 'createdBy');
          console.error(`\n✗ Error creating index ${indexName}: Duplicate ${fieldName} values found`);
          console.error(`  Error details: ${err.message}`);
          
          // Find duplicates
          const duplicates = await collection.aggregate([
            {
              $match: {
                [fieldName]: { $exists: true, $ne: null, $ne: '' }
              }
            },
            {
              $group: {
                _id: { createdBy: '$createdBy', [fieldName]: `$${fieldName}` },
                count: { $sum: 1 },
                userIds: { $push: '$_id' }
              }
            },
            {
              $match: { count: { $gt: 1 } }
            }
          ]).toArray();
          
          if (duplicates.length > 0) {
            console.error(`\n  Found ${duplicates.length} duplicate ${fieldName} entries under the same admin:`);
            duplicates.forEach((dup, idx) => {
              console.error(`    ${idx + 1}. Admin: ${dup._id.createdBy}, ${fieldName}: ${dup._id[fieldName]}, Count: ${dup.count}`);
              console.error(`       User IDs: ${dup.userIds.map(id => id.toString()).join(', ')}`);
            });
            console.error(`\n  Please resolve these duplicates before creating the index.`);
            console.error(`  You can either:`);
            console.error(`    1. Delete duplicate users`);
            console.error(`    2. Update duplicate ${fieldName} values to be unique per admin`);
            console.error(`    3. Set ${fieldName} to null/empty for duplicates (if ${fieldName} is optional)`);
          }
          
          logger.error({ err, duplicates }, `✗ Error creating index ${indexName}: Duplicate ${fieldName} values found`);
        } else {
          console.error(`✗ Error creating index:`, err.message);
          logger.error({ err }, `✗ Error creating index`);
        }
      }
    }
    
    console.log('\n✓ Migration completed successfully!');
    logger.info('Migration completed successfully!');
    console.log('\nCurrent indexes:');
    logger.info('Current indexes:');
    const currentIndexes = await collection.indexes();
    currentIndexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
      logger.info(`  - ${idx.name}:`, idx.key);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    logger.error({ err: error }, 'Migration failed');
    process.exit(1);
  }
};

// Run migration
runMigration();

