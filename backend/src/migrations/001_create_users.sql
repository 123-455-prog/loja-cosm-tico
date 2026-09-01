-- Tabela de usuarios: cadastro e login (Passo 1 + Passo 2 do checklist)
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,          -- sempre com hash (bcrypt), nunca texto puro
  role       TEXT NOT NULL DEFAULT 'customer',   -- 'customer' ou 'admin'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
