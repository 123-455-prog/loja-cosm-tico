/**
 * Executa todas as migrations em src/migrations/ em ordem alfabetica.
 * Cria as tabelas do banco (usuarios, produtos, carrinho, favoritos, pedidos).
 */
const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

async function main() {
  await db.ready; // espera o motor do SQLite (sql.js) carregar

  const migrationsDir = path.join(__dirname, '..', 'src', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Rodando ${files.length} migration(s)...`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      db.exec(sql);
      console.log(`  OK  ${file}`);
    } catch (err) {
      console.error(`  ERRO em ${file}:`, err.message);
      process.exit(1);
    }
  }

  console.log('Migrations concluidas.');
}

main();
