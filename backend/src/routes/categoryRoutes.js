const { Router } = require('express');
const { list, create } = require('../controllers/categoryController');
const { authRequired, adminRequired } = require('../middleware/auth');

const router = Router();

router.get('/', list);
router.post('/', authRequired, adminRequired, create);

module.exports = router;
