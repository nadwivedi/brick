const Plant = require('../models/Plant');
const Unit = require('../models/Unit');
const Product = require('../models/Product');
const Material = require('../models/Material');
const ExpenseCategory = require('../models/ExpenseCategory');

// Everything a new business starts with when an admin adds its owner
const setupOrganization = async (org, owner) => {
  org.owner = owner._id;
  await org.save();
  // The business's first plant, named after it; more plants can be added later
  await Plant.create({ name: org.name, mobile: org.mobile, address: org.address, gstin: org.gstin, organization: org._id, isDefault: true });
  await Unit.ensureDefaults(org._id);
  await ExpenseCategory.ensureDefaults(org._id);
  await Product.insertMany(Product.DEFAULT_PRODUCTS.map(p => ({ ...p, organization: org._id })));
  await Material.insertMany(Material.DEFAULT_MATERIALS.map(m => ({ ...m, organization: org._id })));
};

module.exports = { setupOrganization };
