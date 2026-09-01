/**
 * Passo 4 - API do carrinho. Todas as rotas exigem usuario autenticado.
 * O carrinho e SEMPRE vinculado ao req.user.id (nunca ao body).
 */
const db = require('../config/database');

// SELECT que ja traz os dados do produto para o front nao ter que fazer join.
const SELECT_CART = `
  SELECT ci.id, ci.product_id, ci.quantity,
         p.name, p.image, p.price, p.stock,
         (p.price * ci.quantity) AS subtotal
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
   WHERE ci.user_id = ?
   ORDER BY ci.id DESC
`;

function totalOf(items) {
  return items.reduce((sum, it) => sum + it.subtotal, 0);
}

// GET /api/cart
function list(req, res) {
  const items = db.prepare(SELECT_CART).all(req.user.id);
  res.json({ items, total: totalOf(items) });
}

// POST /api/cart   body: { product_id, quantity }
function add(req, res) {
  const { product_id, quantity } = req.body || {};
  const qty = Number(quantity) || 1;

  if (!product_id) return res.status(400).json({ error: 'product_id e obrigatorio.' });
  if (qty <= 0)    return res.status(400).json({ error: 'quantity deve ser > 0.' });

  const product = db.prepare('SELECT id, stock FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Produto nao encontrado.' });

  // se o item ja existe no carrinho, soma a quantidade
  const existing = db.prepare(
    'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?'
  ).get(req.user.id, product_id);

  const newQty = (existing ? existing.quantity : 0) + qty;
  if (newQty > product.stock) {
    return res.status(400).json({ error: 'Quantidade solicitada acima do estoque.' });
  }

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
  } else {
    db.prepare(
      'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)'
    ).run(req.user.id, product_id, qty);
  }

  const items = db.prepare(SELECT_CART).all(req.user.id);
  res.status(201).json({ items, total: totalOf(items) });
}

// PUT /api/cart/:id   body: { quantity }
function update(req, res) {
  const qty = Number(req.body?.quantity);
  if (!qty || qty <= 0) return res.status(400).json({ error: 'quantity deve ser > 0.' });

  const item = db.prepare(
    'SELECT ci.*, p.stock FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.id = ? AND ci.user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!item) return res.status(404).json({ error: 'Item nao encontrado.' });
  if (qty > item.stock) return res.status(400).json({ error: 'Quantidade acima do estoque.' });

  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(qty, req.params.id);

  const items = db.prepare(SELECT_CART).all(req.user.id);
  res.json({ items, total: totalOf(items) });
}

// DELETE /api/cart/:id
function remove(req, res) {
  const info = db.prepare(
    'DELETE FROM cart_items WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Item nao encontrado.' });

  const items = db.prepare(SELECT_CART).all(req.user.id);
  res.json({ items, total: totalOf(items) });
}

// DELETE /api/cart
function clear(req, res) {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json({ items: [], total: 0 });
}

module.exports = { list, add, update, remove, clear };
