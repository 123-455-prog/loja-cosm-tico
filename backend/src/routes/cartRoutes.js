const { Router } = require('express');
const { list, add, update, remove, clear } = require('../controllers/cartController');
const { authRequired } = require('../middleware/auth');

const router = Router();

// tudo exige login
router.use(authRequired);

router.get('/', list);
router.post('/', add);
router.put('/:id', update);
router.delete('/:id', remove);
router.delete('/', clear);

module.exports = router;
