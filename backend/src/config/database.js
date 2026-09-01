/**
 * Conexao com o banco de dados: SQLite de verdade, via sql.js.
 *
 * O sql.js e o proprio motor do SQLite compilado para WebAssembly. Isso
 * significa que funciona em QUALQUER versao do Node (nao so nas mais novas)
 * e em qualquer sistema operacional, sem compilar absolutamente nada -
 * nao depende de Visual Studio, build tools, nem da versao do Node.
 *
 * A unica particularidade: como ele roda em memoria, este arquivo salva o
 * banco em disco automaticamente depois de cada escrita (insert/update/
 * delete). O resto do codigo (controllers, scripts) nao precisa saber disso.
 *
 * A UNICA coisa assincrona e carregar o motor do SQLite, que so acontece
 * uma vez, no inicio. Por isso este modulo exporta "db.ready" (uma
 * Promise) - quem for USAR o banco pela primeira vez (server.js,
 * scripts/migrate.js, scripts/seed.js) precisa dar "await db.ready" antes.
 * Depois disso, todo o resto do codigo (controllers) usa db.prepare(),
 * db.exec() e db.transaction() normalmente, sem "await" nenhum.
 */
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
require('dotenv').config();

const dbPath = path.resolve(process.env.DB_PATH || './data/cosmetic_store.db');

// garante que a pasta existe
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = {};
let inTransaction = false;

function save() {
  const data = db._raw.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

// Executa uma ou mais instrucoes SQL de uma vez (usado nas migrations e
// em PRAGMAs). Nao devolve linhas.
db.exec = (sql) => {
  db._raw.run(sql);
  if (!inTransaction) save();
  return db;
};

// Prepara uma unica instrucao SQL e devolve um objeto com run/get/all,
// no mesmo estilo do better-sqlite3 (parametros posicionais com "?").
db.prepare = (sql) => ({
  run(...params) {
    const stmt = db._raw.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();

    const changes = db._raw.getRowsModified();
    let lastInsertRowid = null;
    const idRes = db._raw.exec('SELECT last_insert_rowid() AS id');
    if (idRes[0] && idRes[0].values[0]) {
      lastInsertRowid = idRes[0].values[0][0];
    }

    if (!inTransaction) save();
    return { changes, lastInsertRowid };
  },
  get(...params) {
    const stmt = db._raw.prepare(sql);
    stmt.bind(params);
    let row;
    if (stmt.step()) row = stmt.getAsObject();
    stmt.free();
    return row;
  },
  all(...params) {
    const stmt = db._raw.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  },
});

// Roda uma funcao inteira dentro de uma transacao (tudo ou nada).
// Uso: const trx = db.transaction(() => {...}); trx();
db.transaction = (fn) => {
  return (...args) => {
    inTransaction = true;
    db._raw.run('BEGIN');
    try {
      const result = fn(...args);
      db._raw.run('COMMIT');
      inTransaction = false;
      save();
      return result;
    } catch (err) {
      db._raw.run('ROLLBACK');
      inTransaction = false;
      throw err;
    }
  };
};

db.ready = (async () => {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db._raw = new SQL.Database(fileBuffer);
  } else {
    db._raw = new SQL.Database();
  }

  db._raw.run('PRAGMA foreign_keys = ON');
})();

module.exports = db;
