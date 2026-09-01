/**
 * Handler global de erros. Deve ser o ultimo middleware do app.
 */
function notFound(req, res, next) {
  res.status(404).json({ error: 'Rota nao encontrada.' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Erro interno do servidor.',
  });
}

module.exports = { notFound, errorHandler };
