const { Router } = require('express');
const { list, add, remove } = require('../controllers/favoriteController');
const { authRequired } = require('../middleware/auth');

const router = Router();

router.use(authRequired);

router.get('/', list);
router.post('/', add);
router.delete('/:id', remove);

module.exports = router;
