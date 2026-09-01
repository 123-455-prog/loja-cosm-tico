/**
 * Passo extra (roadmap opcional) - Checkout e historico de pedidos.
 * Cria um pedido a partir do carrinho do usuario, atualiza o estoque
 * e limpa o carrinho, tudo em uma transacao.
 */
const db = require('../config/database');

// POST /api/orders   -> transforma o carrinho em um pedido
function checkout(req, res) {
  const userId = req.user.id;

  const cart = db.prepare(`
    SELECT ci.product_id, ci.quantity, p.price, p.stock, p.name
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = ?
  `).all(userId);

  if (cart.length === 0) {
    return res.status(400).json({ error: 'Carrinho vazio.' });
  }

  // valida estoque antes de comecar
  for (const it of cart) {
    if (it.quantity > it.stock) {
      return res.status(400).json({ error: `Estoque insuficiente para "${it.name}".` });
    }
  }

  const total = cart.reduce((s, it) => s + it.price * it.quantity, 0);

  const trx = db.transaction(() => {
    const order = db.prepare(
      'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)'
    ).run(userId, total, 'pending');

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price)
      VALUES (?, ?, ?, ?)
    `);
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const it of cart) {
      insertItem.run(order.lastInsertRowid, it.product_id, it.quantity, it.price);
      updateStock.run(it.quantity, it.product_id);
    }

    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
    return order.lastInsertRowid;
  });

  const orderId = trx();
  const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  res.status(201).json({ order: { ...created, items } });
}

// GET /api/orders   -> historico do usuario logado
function list(req, res) {
  const orders = db.prepare(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  res.json({ orders });
}

// GET /api/orders/:id
function getOne(req, res) {
  const order = db.prepare(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Pedido nao encontrado.' });

  const items = db.prepare(`
    SELECT oi.*, p.name, p.image
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?
  `).all(order.id);

  res.json({ order: { ...order, items } });
}

module.exports = { checkout, list, getOne };
