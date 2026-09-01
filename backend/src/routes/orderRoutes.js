const { Router } = require('express');
const { checkout, list, getOne } = require('../controllers/orderController');
const { authRequired } = require('../middleware/auth');

const router = Router();

router.use(authRequired);

router.post('/', checkout);
router.get('/', list);
router.get('/:id', getOne);

module.exports = router;
