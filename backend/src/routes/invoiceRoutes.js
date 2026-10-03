const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/outstanding', ctrl.outstanding);
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/payment', ctrl.addPayment);

module.exports = router;
