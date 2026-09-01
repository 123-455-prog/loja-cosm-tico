/**
 * Passo 3 - API de produtos.
 * GET publicos, POST/PUT/DELETE restritos ao admin.
 */
const db = require('../config/database');

// GET /api/products?category=slug&search=texto
function list(req, res) {
  const { category, search } = req.query;
  const where = [];
  const params = [];

  if (category) {
    where.push('c.slug = ?');
    params.push(category);
  }
  if (search) {
    where.push('(p.name LIKE ? OR p.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const sql = `
    SELECT p.id, p.name, p.description, p.image, p.price, p.stock,
           c.id AS category_id, c.name AS category_name, c.slug AS category_slug
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY p.id DESC
  `;
  const rows = db.prepare(sql).all(...params);
  res.json({ products: rows });
}

// GET /api/products/:id
function getOne(req, res) {
  const row = db.prepare(`
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Produto nao encontrado.' });
  res.json({ product: row });
}

// POST /api/products   (admin)
function create(req, res) {
  const { name, description, image, price, category_id, stock } = req.body || {};
  if (!name || price == null) {
    return res.status(400).json({ error: 'name e price sao obrigatorios.' });
  }
  const info = db.prepare(`
    INSERT INTO products (name, description, image, price, category_id, stock)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, description || null, image || null, price, category_id || null, stock || 0);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ product });
}

// PUT /api/products/:id   (admin)
function update(req, res) {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Produto nao encontrado.' });

  const { name, description, image, price, category_id, stock } = req.body || {};
  db.prepare(`
    UPDATE products
       SET name        = COALESCE(?, name),
           description = COALESCE(?, description),
           image       = COALESCE(?, image),
           price       = COALESCE(?, price),
           category_id = COALESCE(?, category_id),
           stock       = COALESCE(?, stock)
     WHERE id = ?
  `).run(name, description, image, price, category_id, stock, req.params.id);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json({ product });
}

// DELETE /api/products/:id   (admin)
function remove(req, res) {
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Produto nao encontrado.' });
  res.status(204).end();
}

module.exports = { list, getOne, create, update, remove };
