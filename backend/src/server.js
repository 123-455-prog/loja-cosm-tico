/**
 * Ponto de entrada do servidor.
 */
require('dotenv').config();
const db = require('./config/database');
const app = require('./app');

const PORT = process.env.PORT || 3333;

// espera o motor do banco (sql.js) terminar de carregar antes de aceitar requisicoes
db.ready
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API rodando em http://localhost:${PORT}`);
      console.log(`Health check:  http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('Nao foi possivel iniciar o banco de dados:', err);
    process.exit(1);
  });
