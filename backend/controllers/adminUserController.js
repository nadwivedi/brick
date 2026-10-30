const User = require('../models/User');
const Organization = require('../models/Organization');
const { setupOrganization } = require('../utils/organizationSetup');
const { createAccessLink } = require('../utils/adminAccess');
const { recordAdminActivity, snapshot, diffSnapshots } = require('../utils/adminActivityLog');

// Fields compared for the activity center when a user is added, edited or deleted
const USER_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'businessName', label: 'Business' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'state', label: 'State' },
  { key: 'district', label: 'District' },
  { key: 'planType', label: 'Plan' },
  { key: 'planPrice', label: 'Plan Price' },
  { key: 'planStartAt', label: 'Plan Start' },
  { key: 'planEndAt', label: 'Plan End' },
];

const userSnapshot = (user, businessName) => snapshot({ ...user.toObject(), businessName }, USER_FIELDS);

const sanitizeAdminUser = (user) => ({
  id: user._id,
  name: user.name,
  businessName: user.organization?.name || '',
  mobile: user.mobile,
  state: user.state || '',
  district: user.district || '',
  lastLoginAt: user.lastLoginAt || null,
  lastActivityAt: user.lastActivityAt || null,
  // Owners who registered themselves have no plan until one is set here
  planType: user.planType || null,
  planPrice: Number(user.planPrice || 0),
  planStartAt: user.planStartAt || null,
  planEndAt: user.planEndAt || null,
  isActive: user.isActive !== false,
  deactivatedAt: user.deactivatedAt || null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const validMobile = (mobile = '') => /^\d{10}$/.test(String(mobile).trim());

const PLAN_TYPES = ['yearly', 'lifetime'];

// 'YYYY-MM-DD' -> start of that day in India time; null when empty, undefined when not a date
const readPlanDate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const text = value instanceof Date ? value.toISOString() : String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  const date = new Date(`${text}T00:00:00+05:30`);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

// The plan from the request, or an error message for the admin
const readPlan = (body = {}) => {
  const planType = String(body.planType || '').trim();
  if (!PLAN_TYPES.includes(planType)) return { error: 'Choose a yearly or lifetime plan' };
  const planPrice = Number(body.planPrice);
  if (!Number.isFinite(planPrice) || planPrice < 0) return { error: 'Enter a valid plan price' };
  const planStartAt = readPlanDate(body.planStartAt);
  if (planStartAt === undefined) return { error: 'Enter a valid plan start date' };
  // A lifetime plan never ends
  const planEndAt = planType === 'lifetime' ? null : readPlanDate(body.planEndAt);
  if (planEndAt === undefined) return { error: 'Enter a valid plan end date' };
  if (planStartAt && planEndAt && planEndAt < planStartAt) return { error: 'Plan end date must be after the start date' };
  return { planType, planPrice: Math.round(planPrice * 100) / 100, planStartAt, planEndAt };
};

// @route GET /api/admin/users — owner accounts of the app, newest first
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'owner' }).sort({ createdAt: -1 }).select('-password').populate('organization', 'name');
    res.json({ success: true, count: users.length, data: users.map(sanitizeAdminUser) });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/users — a new owner with their business
exports.createUser = async (req, res, next) => {
  try {
    const { name, businessName, mobile, password, state, district } = req.body;

    if (!name?.trim() || !mobile?.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Name, mobile and password are required' });
    }
    if (!validMobile(mobile)) {
      return res.status(400).json({ success: false, message: 'Mobile number must be exactly 10 digits' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const plan = readPlan(req.body);
    if (plan.error) {
      return res.status(400).json({ success: false, message: plan.error });
    }

    const normalizedMobile = mobile.trim();
    if (await User.exists({ mobile: normalizedMobile })) {
      return res.status(409).json({ success: false, message: 'A user with this mobile number already exists' });
    }

    const org = await Organization.create({ name: businessName?.trim() || name.trim(), mobile: normalizedMobile });
    let user;
    try {
      user = await User.create({
        name: name.trim(),
        mobile: normalizedMobile,
        password,
        role: 'owner',
        organization: org._id,
        state: state?.trim() || '',
        district: district?.trim() || '',
        ...plan,
      });
    } catch (error) {
      await Organization.deleteOne({ _id: org._id });
      throw error;
    }
    await setupOrganization(org, user);

    recordAdminActivity(req, {
      action: 'create',
      entity: 'user',
      entityId: user._id,
      entityName: user.name,
      summary: `Added user ${user.name} (${user.mobile})`,
      changes: diffSnapshots({}, userSnapshot(user, org.name), USER_FIELDS),
    });

    user.organization = org;
    res.status(201).json({ success: true, message: 'User created successfully', data: sanitizeAdminUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A user with this mobile number already exists' });
    }
    next(error);
  }
};

// @route PUT /api/admin/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const { name, businessName, mobile, password, state, district } = req.body;

    const user = await User.findOne({ _id: req.params.id, role: 'owner' }).populate('organization', 'name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const org = user.organization;
    const before = userSnapshot(user, org?.name);

    if (mobile !== undefined) {
      if (!validMobile(mobile)) {
        return res.status(400).json({ success: false, message: 'Mobile number must be exactly 10 digits' });
      }
      const normalizedMobile = mobile.trim();
      if (normalizedMobile !== user.mobile) {
        if (await User.exists({ mobile: normalizedMobile, _id: { $ne: user._id } })) {
          return res.status(409).json({ success: false, message: 'This mobile number is already in use' });
        }
        user.mobile = normalizedMobile;
      }
    }

    const planFields = ['planType', 'planPrice', 'planStartAt', 'planEndAt'];
    if (planFields.some(key => req.body[key] !== undefined)) {
      const plan = readPlan(Object.fromEntries(planFields.map(key => [key, req.body[key] !== undefined ? req.body[key] : user[key]])));
      if (plan.error) {
        return res.status(400).json({ success: false, message: plan.error });
      }
      Object.assign(user, plan);
    }

    if (name !== undefined) user.name = name.trim();
    if (state !== undefined) user.state = state.trim();
    if (district !== undefined) user.district = district.trim();

    const passwordChanged = password !== undefined && password !== '';
    if (passwordChanged) {
      if (String(password).length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }
      // Hashed by the model on save
      user.password = password;
    }

    if (!user.name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    // Validate before saving either record, so a bad edit changes nothing
    await user.validate();
    if (org && businessName?.trim() && businessName.trim() !== org.name) {
      await Organization.updateOne({ _id: org._id }, { $set: { name: businessName.trim() } });
      org.name = businessName.trim();
    }
    await user.save();

    const changes = diffSnapshots(before, userSnapshot(user, org?.name), USER_FIELDS);
    if (passwordChanged) changes.push({ field: 'Password', from: '••••••', to: 'Changed' });
    if (changes.length) {
      recordAdminActivity(req, {
        action: 'update',
        entity: 'user',
        entityId: user._id,
        entityName: user.name,
        summary: `Edited user ${user.name}`,
        changes,
      });
    }

    res.json({ success: true, message: 'User updated successfully', data: sanitizeAdminUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'This mobile number is already in use' });
    }
    next(error);
  }
};

// @route DELETE /api/admin/users/:id — removes the login; the business's records stay in the database
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, role: 'owner' }).populate('organization', 'name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    recordAdminActivity(req, {
      action: 'delete',
      entity: 'user',
      entityId: user._id,
      entityName: user.name,
      summary: `Deleted user ${user.name} (${user.mobile})`,
      changes: diffSnapshots(userSnapshot(user, user.organization?.name), {}, USER_FIELDS),
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @route PATCH /api/admin/users/:id/status — a deactivated owner can't sign in or use an open session
exports.setUserStatus = async (req, res, next) => {
  try {
    if (typeof req.body?.isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Say whether the account should be active' });
    }

    const { isActive } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'owner' },
      { $set: { isActive, deactivatedAt: isActive ? null : new Date() } },
      { new: true }
    ).populate('organization', 'name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    recordAdminActivity(req, {
      action: isActive ? 'activate' : 'deactivate',
      entity: 'user',
      entityId: user._id,
      entityName: user.name,
      summary: `${isActive ? 'Activated' : 'Deactivated'} user ${user.name}`,
    });

    res.json({ success: true, message: isActive ? 'Account activated' : 'Account deactivated', data: sanitizeAdminUser(user) });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/users/:id/access — a one-time link that opens the app signed in as this user
exports.getUserAccessLink = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'owner' }).select('_id name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    recordAdminActivity(req, {
      action: 'access',
      entity: 'user',
      entityId: user._id,
      entityName: user.name,
      summary: `Opened the app as ${user.name}`,
    });
    res.json({ success: true, data: { url: createAccessLink(user._id, req.adminId), name: user.name } });
  } catch (error) {
    next(error);
  }
};
