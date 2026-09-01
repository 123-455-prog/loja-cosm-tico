/**
 * Passo 5 - API de favoritos. Todas as rotas exigem usuario autenticado.
 */
const db = require('../config/database');

const SELECT_FAV = `
  SELECT f.id, f.product_id, p.name, p.image, p.price
    FROM favorites f
    JOIN products p ON p.id = f.product_id
   WHERE f.user_id = ?
   ORDER BY f.id DESC
`;

// GET /api/favorites
function list(req, res) {
  const items = db.prepare(SELECT_FAV).all(req.user.id);
  res.json({ items });
}

// POST /api/favorites   body: { product_id }
function add(req, res) {
  const { product_id } = req.body || {};
  if (!product_id) return res.status(400).json({ error: 'product_id e obrigatorio.' });

  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Produto nao encontrado.' });

  try {
    db.prepare(
      'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)'
    ).run(req.user.id, product_id);
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      // ja e favorito -> ok, idempotente
    } else {
      throw err;
    }
  }

  const items = db.prepare(SELECT_FAV).all(req.user.id);
  res.status(201).json({ items });
}

// DELETE /api/favorites/:id
// obs.: :id aqui e o id do produto (mais pratico para o front)
function remove(req, res) {
  const info = db.prepare(
    'DELETE FROM favorites WHERE user_id = ? AND product_id = ?'
  ).run(req.user.id, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Favorito nao encontrado.' });

  const items = db.prepare(SELECT_FAV).all(req.user.id);
  res.json({ items });
}

module.exports = { list, add, remove };
