-- Categorias dos produtos (ex.: Rosto, Cabelo, Corpo, Maquiagem, Perfumes)
CREATE TABLE IF NOT EXISTS categories (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);
