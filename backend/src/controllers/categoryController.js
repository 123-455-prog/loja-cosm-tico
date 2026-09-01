/**
 * Passo 3 - API de categorias.
 */
const db = require('../config/database');

function list(req, res) {
  const rows = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json({ categories: rows });
}

function create(req, res) {
  const { name, slug } = req.body || {};
  if (!name || !slug) return res.status(400).json({ error: 'name e slug sao obrigatorios.' });
  try {
    const info = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run(name, slug);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ category });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Categoria ja existe.' });
    }
    throw err;
  }
}

module.exports = { list, create };
