const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/adminAuth');
const { loginAdmin, getCurrentAdmin, logoutAdmin } = require('../controllers/adminAuthController');
const { getUsers, createUser, updateUser, deleteUser, setUserStatus, getUserAccessLink } = require('../controllers/adminUserController');
const { getAdminActivity } = require('../controllers/adminAuditController');
const { getDeployStatus, startDeploy } = require('../controllers/adminDeployController');

// The admin panel (admin/ folder, adm.brickmanager.in)
router.post('/auth/login', loginAdmin);

router.use(adminAuth);
router.get('/auth/current', getCurrentAdmin);
router.post('/auth/logout', logoutAdmin);

// Owner accounts of the app
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/access', getUserAccessLink);
router.patch('/users/:id/status', setUserStatus);

// Everything an admin added, edited or deleted
router.get('/audit/activity', getAdminActivity);

// Pull the latest code and update the server
router.get('/deploy', getDeployStatus);
router.post('/deploy', startDeploy);

module.exports = router;
