# Cosmetic Store - Backend

Backend da loja de cosmeticos, feito seguindo o `checklist-backend.pdf`:

- **Passo 1** - Banco de dados (SQLite, migrations e seed)
- **Passo 2** - Autenticacao (cadastro, login com bcrypt e JWT, middleware)
- **Passo 3** - API de produtos e categorias
- **Passo 4** - API de carrinho (vinculado ao usuario autenticado)
- **Passo 5** - API de favoritos (vinculado ao usuario autenticado)
- **Extra**   - Checkout / historico de pedidos

## Stack

- Node.js (22.5+) + Express
- SQLite nativo do Node (`node:sqlite`) - sem compilacao, nao depende de Visual Studio/build tools - migra facil para PostgreSQL/MySQL depois
- `bcryptjs` para hash de senha
- `jsonwebtoken` para o token de sessao (JWT)
- `dotenv` para variaveis de ambiente
- `cors` para liberar o front-end

## Estrutura de arquivos

```
backend/
├── .env                 # variaveis de ambiente (nao versionar)
├── .env.example         # exemplo do .env
├── package.json
├── data/
│   └── cosmetic_store.db   # banco SQLite (gerado)
├── scripts/
│   ├── migrate.js       # roda as migrations
│   └── seed.js          # popula com dados de exemplo
└── src/
    ├── server.js        # entrada da aplicacao
    ├── app.js           # configuracao do Express
    ├── config/
    │   └── database.js  # conexao com o banco
    ├── migrations/      # scripts SQL de criacao das tabelas
    │   ├── 001_create_users.sql
    │   ├── 002_create_categories.sql
    │   ├── 003_create_products.sql
    │   ├── 004_create_cart.sql
    │   ├── 005_create_favorites.sql
    │   └── 006_create_orders.sql
    ├── middleware/
    │   ├── auth.js          # authRequired, adminRequired
    │   └── errorHandler.js  # 404 + handler global de erros
    ├── controllers/
    │   ├── authController.js
    │   ├── categoryController.js
    │   ├── productController.js
    │   ├── cartController.js
    │   ├── favoriteController.js
    │   └── orderController.js
    └── routes/
        ├── authRoutes.js
        ├── categoryRoutes.js
        ├── productRoutes.js
        ├── cartRoutes.js
        ├── favoriteRoutes.js
        └── orderRoutes.js
```

## Como rodar

```bash
cd backend
cp .env.example .env    # ajuste o JWT_SECRET
npm install
npm run setup           # cria tabelas + popula com dados de exemplo
npm start               # sobe em http://localhost:3333
```

Usuarios de teste criados pelo seed:

| Papel   | Email              | Senha       |
|---------|--------------------|-------------|
| Admin   | admin@loja.com     | admin123    |
| Cliente | cliente@loja.com   | cliente123  |

## Endpoints da API

Base URL: `http://localhost:3333/api`

Rotas marcadas com `[auth]` precisam do header:
`Authorization: Bearer <token>`

### Autenticacao

| Metodo | Rota              | Descricao                              |
|--------|-------------------|----------------------------------------|
| POST   | `/auth/register`  | Cadastro `{ name, email, password }`   |
| POST   | `/auth/login`     | Login `{ email, password }` -> token   |
| GET    | `/auth/me` `[auth]` | Dados do usuario logado              |

### Produtos e categorias

| Metodo | Rota                | Descricao                    |
|--------|---------------------|------------------------------|
| GET    | `/products`         | Lista (filtros `?category=&search=`) |
| GET    | `/products/:id`     | Detalhe de um produto        |
| POST   | `/products` `[admin]` | Cria produto               |
| PUT    | `/products/:id` `[admin]` | Edita produto          |
| DELETE | `/products/:id` `[admin]` | Remove produto         |
| GET    | `/categories`       | Lista categorias             |
| POST   | `/categories` `[admin]` | Cria categoria           |

### Carrinho `[auth]`

| Metodo | Rota          | Descricao                                    |
|--------|---------------|----------------------------------------------|
| GET    | `/cart`       | Lista os itens do carrinho do usuario logado |
| POST   | `/cart`       | Adiciona item `{ product_id, quantity }`     |
| PUT    | `/cart/:id`   | Atualiza quantidade `{ quantity }`           |
| DELETE | `/cart/:id`   | Remove um item                               |
| DELETE | `/cart`       | Esvazia o carrinho                           |

### Favoritos `[auth]`

| Metodo | Rota                 | Descricao                             |
|--------|----------------------|---------------------------------------|
| GET    | `/favorites`         | Lista favoritos do usuario            |
| POST   | `/favorites`         | Favorita `{ product_id }` (idempotente) |
| DELETE | `/favorites/:id`     | Desfavorita (`:id` = product_id)      |

### Pedidos `[auth]` (checkout - stretch goal)

| Metodo | Rota           | Descricao                                        |
|--------|----------------|--------------------------------------------------|
| POST   | `/orders`      | Fecha o pedido a partir do carrinho              |
| GET    | `/orders`      | Historico de pedidos do usuario                  |
| GET    | `/orders/:id`  | Detalhe de um pedido (com itens)                 |

## Conexao com o front-end existente

Segundo o checklist, os arquivos do front-end que passam a consumir a API:

- `login.html` / `js/auth.js` -> `POST /api/auth/register` e `POST /api/auth/login`.
  Trocar o `preventDefault()` de aviso pela chamada real e salvar o token
  retornado em `localStorage`.
- `index.html` -> `GET /api/products` e `GET /api/categories` para trocar
  os produtos fixos.
- `cart.html` / `js/cart.js` -> substituir o array `cartItems` pelas rotas
  `/api/cart` (com o token no header).
- `favorites.html` / `js/favorites.js` -> substituir `favoriteItems`
  por `/api/favorites`.

### Exemplo (fetch com token)

```js
const token = localStorage.getItem('token');

fetch('http://localhost:3333/api/cart', {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(r => r.json())
  .then(({ items, total }) => renderCart(items, total));
```

## Notas de seguranca

- Senhas guardadas apenas com hash bcrypt (`authController.register`).
- Rotas protegidas passam por `authRequired` (`src/middleware/auth.js`).
- Rotas de gerenciamento (`POST/PUT/DELETE /products`, `POST /categories`)
  exigem tambem `adminRequired`.
- Carrinho/favoritos/pedidos usam sempre `req.user.id`, nunca um `user_id`
  vindo do body - o cliente nao consegue mexer em dados de outro usuario.
- `JWT_SECRET` deve ser trocado em producao (definido no `.env`).
