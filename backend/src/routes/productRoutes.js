const { Router } = require('express');
const { list, getOne, create, update, remove } = require('../controllers/productController');
const { authRequired, adminRequired } = require('../middleware/auth');

const router = Router();

// publicos
router.get('/', list);
router.get('/:id', getOne);

// admin
router.post('/', authRequired, adminRequired, create);
router.put('/:id', authRequired, adminRequired, update);
router.delete('/:id', authRequired, adminRequired, remove);

module.exports = router;
