const mongoose = require('mongoose');
const { TRANSPORT_BASES } = require('../utils/transport');

// A vehicle bricks are carried in. Picking it on a sale fills in the transport choice.
const vehicleSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, trim: true, uppercase: true },
  // party: the buyer's own vehicle. own: my vehicle. hired: hired from a transporter (`party`).
  ownership: { type: String, enum: ['party', 'own', 'hired'], default: 'party' },
  party: { type: mongoose.Schema.Types.ObjectId, ref: 'Party' }, // whose vehicle it is (party / hired)
  // What a hired vehicle is usually paid; filled into the sale, which can change it
  hireBasis: { type: String, enum: TRANSPORT_BASES, default: 'per_trip' },
  hireRate: { type: Number, default: 0, min: 0 },
  // Per-trip routes: from a plant to a location, what the transporter is paid per trip (hired)
  // and what the party is charged per trip
  tripRates: [{
    _id: false,
    plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
    location: { type: String, trim: true, required: true },
    rate: { type: Number, default: 0, min: 0 },
    charge: { type: Number, default: 0, min: 0 },
  }],
  notes: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

vehicleSchema.index({ organization: 1, vehicleNumber: 1 }, { unique: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
