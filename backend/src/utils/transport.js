const mongoose = require('mongoose');

// Whose vehicle carried a sale: the party's own, mine, or one hired from a transporter
const TRANSPORT_MODES = ['party', 'own', 'hired'];
// How a hired vehicle is paid
const TRANSPORT_BASES = ['per_trip', 'per_ton', 'per_km', 'per_1000', 'fixed'];

const num = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0);
const round = (n) => Math.round(n * 100) / 100;

// A fixed amount ignores the quantity
const transportCost = (basis, qty, rate) => round(basis === 'fixed' ? num(rate) : num(qty) * num(rate));

/**
 * The transport fields of a sale, cleaned up from what the client sent.
 * transportCharges is what the party pays (inside the invoice total);
 * transportCost is what we owe the transporter of a hired vehicle (added to their party balance).
 * Throws an Error with statusCode 400 when a hired vehicle has no valid transporter.
 */
const resolveSaleTransport = async (organization, body = {}) => {
  const Party = mongoose.model('Party');
  const mode = TRANSPORT_MODES.includes(body.transportMode) ? body.transportMode : 'party';
  const none = { transportMode: mode, transporter: null, transportBasis: 'per_trip', transportQty: 0, transportRate: 0, transportCost: 0, transportLocation: '' };
  const transportLocation = String(body.transportLocation || '').trim();
  // The party's own vehicle: nothing to charge or pay; the location is where it came from to the plant
  if (mode === 'party') return { ...none, transportCharges: 0, transportLocation };
  const transportCharges = num(body.transportCharges);
  // My vehicle: a delivery to a location counts trips (1 unless typed)
  if (mode === 'own') return { ...none, transportCharges, transportLocation, transportQty: transportLocation ? num(body.transportQty) || 1 : 0 };

  const fail = (message) => Object.assign(new Error(message), { statusCode: 400 });
  if (!mongoose.Types.ObjectId.isValid(body.transporter)) throw fail('Select the transporter the vehicle is hired from');
  const transporter = await Party.findOne({ _id: body.transporter, organization }).select('_id');
  if (!transporter) throw fail('Transporter not found');

  const transportBasis = TRANSPORT_BASES.includes(body.transportBasis) ? body.transportBasis : 'per_trip';
  const transportQty = transportBasis === 'fixed' ? 1 : num(body.transportQty);
  const transportRate = num(body.transportRate);
  return {
    transportMode: 'hired', transportCharges, transporter: transporter._id,
    transportBasis, transportQty, transportRate,
    transportLocation: transportBasis === 'per_trip' ? transportLocation : '',
    transportCost: transportCost(transportBasis, transportQty, transportRate),
  };
};

// Vehicle numbers are kept in capitals with no spaces, e.g. MH04AB1234 (at most 10 characters)
const VEHICLE_NUMBER_MAX = 10;
const cleanVehicleNumber = (value) => String(value || '').replace(/\s+/g, '').toUpperCase();

// The vehicle picked or typed on a sale; a new number is added to the vehicle master
const resolveSaleVehicle = async (organization, body, transport) => {
  const Vehicle = mongoose.model('Vehicle');
  const vehicleNumber = cleanVehicleNumber(body.vehicleNumber);
  if (vehicleNumber.length > VEHICLE_NUMBER_MAX) {
    throw Object.assign(new Error(`Vehicle number can be at most ${VEHICLE_NUMBER_MAX} characters`), { statusCode: 400 });
  }
  if (!vehicleNumber) return { vehicle: null, vehicleNumber: '' };
  let vehicle = await Vehicle.findOne({ organization, vehicleNumber });
  if (!vehicle) {
    vehicle = await Vehicle.create({
      organization, vehicleNumber,
      ownership: transport.transportMode,
      party: transport.transportMode === 'hired' ? transport.transporter : transport.transportMode === 'party' ? body.customer : undefined,
      hireBasis: transport.transportBasis,
      hireRate: transport.transportRate,
      // The route this sale went on becomes the vehicle's first per-trip rate
      tripRates: transport.transportLocation && transport.transportMode !== 'party' ? [{
        plant: body.plant, location: transport.transportLocation,
        rate: transport.transportMode === 'hired' ? transport.transportRate : 0,
      }] : [],
    }).catch(e => {
      // Saved by another request at the same moment
      if (e.code !== 11000) throw e;
      return Vehicle.findOne({ organization, vehicleNumber });
    });
  }
  return { vehicle: vehicle._id, vehicleNumber };
};

// "2 trips × ₹1,500 to Raipur", "12 tons × ₹300", or "Fixed amount"
const UNITS = { per_trip: 'trip', per_ton: 'ton', per_km: 'km', per_1000: '1000 bricks' };
const describeTransport = (basis, qty, rate, location) => {
  const unit = UNITS[basis];
  if (!unit) return 'Fixed amount';
  const plural = qty === 1 || unit === 'km' || unit === '1000 bricks' ? unit : `${unit}s`;
  return `${(qty || 0).toLocaleString('en-IN')} ${plural} × ₹${(rate || 0).toLocaleString('en-IN')}${location ? ` to ${location}` : ''}`;
};

// Per-trip routes from the vehicle form: rows with a location, numbers cleaned, one row per plant + location
const cleanTripRates = (rows) => {
  const seen = new Set();
  return (Array.isArray(rows) ? rows : [])
    .map(r => ({
      plant: mongoose.Types.ObjectId.isValid(r?.plant) ? r.plant : undefined,
      location: String(r?.location || '').trim(),
      rate: num(r?.rate),
      charge: num(r?.charge),
    }))
    .filter(r => {
      const key = `${r.plant || ''}|${r.location.toLowerCase()}`;
      if (!r.location || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

module.exports = { TRANSPORT_MODES, TRANSPORT_BASES, transportCost, resolveSaleTransport, resolveSaleVehicle, describeTransport, cleanTripRates, VEHICLE_NUMBER_MAX, cleanVehicleNumber };
