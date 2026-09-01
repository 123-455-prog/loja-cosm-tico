/**
 * Popula o banco com dados de exemplo:
 * - categorias e produtos da loja
 * - 1 usuario admin e 1 cliente de teste
 */
const bcrypt = require('bcryptjs');
const db = require('../src/config/database');

const categories = [
  { name: 'Rosto',      slug: 'rosto' },
  { name: 'Cabelo',     slug: 'cabelo' },
  { name: 'Corpo',      slug: 'corpo' },
  { name: 'Maquiagem',  slug: 'maquiagem' },
  { name: 'Perfumes',   slug: 'perfumes' },
];

const products = [
  { name: 'Serum Facial Vitamina C',   description: 'Ilumina e uniformiza a pele.',            image: 'images/product-1.jpg',   price: 89.90,  category: 'rosto',     stock: 40 },
  { name: 'Hidratante Facial',          description: 'Hidratacao 24h para todos os tipos de pele.', image: 'images/product-2.jpg', price: 59.90,  category: 'rosto',     stock: 60 },
  { name: 'Shampoo Reparador',          description: 'Recupera fios danificados.',              image: 'images/product-3.jpg',      price: 39.90,  category: 'cabelo',    stock: 80 },
  { name: 'Mascara Capilar Nutritiva',  description: 'Nutricao profunda em 5 minutos.',         image: 'images/product-4.jpg',      price: 49.90,  category: 'cabelo',    stock: 45 },
  { name: 'Hidratante Corporal',        description: 'Perfume suave e absorcao rapida.',        image: 'images/product-5.jpg',     price: 34.90,  category: 'corpo',     stock: 100 },
  { name: 'Batom Matte Vermelho',       description: 'Longa duracao, acabamento matte.',        image: 'images/product-6.jpg',        price: 29.90,  category: 'maquiagem', stock: 120 },
  { name: 'Base Liquida HD',            description: 'Cobertura media, toque seco.',            image: 'images/product-7.jpg',         price: 79.90,  category: 'maquiagem', stock: 55 },
  { name: 'Perfume Floral 100ml',       description: 'Fragrancia floral marcante.',             image: 'images/product-8.jpg',      price: 189.90, category: 'perfumes',  stock: 25 },
];

async function main() {
  await db.ready; // espera o motor do SQLite (sql.js) carregar

  const seed = db.transaction(() => {
    // categorias
    const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)');
    for (const c of categories) insertCat.run(c.name, c.slug);

    // produtos
    const findCat = db.prepare('SELECT id FROM categories WHERE slug = ?');
    const countProd = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
    if (countProd === 0) {
      const insertProd = db.prepare(`
        INSERT INTO products (name, description, image, price, category_id, stock)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const p of products) {
        const cat = findCat.get(p.category);
        insertProd.run(p.name, p.description, p.image, p.price, cat ? cat.id : null, p.stock);
      }
    }

    // usuarios de teste
    const findUser = db.prepare('SELECT id FROM users WHERE email = ?');
    const insertUser = db.prepare(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
    );

    if (!findUser.get('admin@loja.com')) {
      insertUser.run('Admin', 'admin@loja.com', bcrypt.hashSync('admin123', 10), 'admin');
    }
    if (!findUser.get('cliente@loja.com')) {
      insertUser.run('Cliente Teste', 'cliente@loja.com', bcrypt.hashSync('cliente123', 10), 'customer');
    }
  });

  seed();

  console.log('Seed concluido.');
  console.log('  Admin   -> admin@loja.com   / admin123');
  console.log('  Cliente -> cliente@loja.com / cliente123');
}

main();
