const mongoose = require('mongoose');
const Party = require('../models/Party');

// Customers and vendors used to be kept apart; they are now one list of parties.
// Each old customer/vendor is copied into parties once, keeping its _id so every sale, purchase
// and payment that points at it still does. A vendor's opening balance meant "we owe them",
// so it flips sign. The old documents are left in place, marked as copied.
async function migrateParties() {
  const db = mongoose.connection.db;
  const sources = [
    { collection: 'customers', sign: 1 },
    { collection: 'vendors', sign: -1 },
  ];
  let copied = 0;
  for (const { collection, sign } of sources) {
    const old = db.collection(collection);
    const pending = await old.find({ migratedToParty: { $ne: true } }).toArray();
    for (const doc of pending) {
      // A party with this _id may already exist if an earlier run stopped half way
      if (!(await Party.exists({ _id: doc._id }))) {
        await Party.collection.insertOne({
          _id: doc._id,
          name: doc.name,
          mobile: doc.mobile,
          address: doc.address,
          gstin: doc.gstin,
          openingBalance: sign * (doc.openingBalance || 0) || 0, // || 0 keeps a zero from becoming -0
          creditLimit: doc.creditLimit || 0,
          organization: doc.organization,
          isActive: doc.isActive !== false,
          createdAt: doc.createdAt || new Date(),
          updatedAt: new Date(),
        });
        copied += 1;
      }
      await old.updateOne({ _id: doc._id }, { $set: { migratedToParty: true } });
    }
  }
  if (copied) console.log(`👥 Copied ${copied} customer/vendor record(s) into parties`);
}

module.exports = migrateParties;
