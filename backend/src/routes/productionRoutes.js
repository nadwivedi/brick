const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productionController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/summary', ctrl.summary);
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
