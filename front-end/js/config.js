// Configuracao compartilhada de acesso a API do backend.
// Usado por auth.js, products.js, cart.js e favorites.js.

// Em localhost usa o backend local; quando publicado (Vercel), usa o
// backend hospedado no Render. TROQUE a linha abaixo pela URL real do
// seu backend depois de fazer o deploy dele no Render.
const RENDER_BACKEND_URL = 'https://loja-cosm-tico.onrender.com';

const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE_URL = isLocal ? 'http://localhost:3333/api' : `${RENDER_BACKEND_URL}/api`;

function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function isLoggedIn() {
  return Boolean(getToken());
}

// Wrapper de fetch que:
// - monta a URL completa a partir de API_BASE_URL
// - manda o token no header Authorization quando existe
// - ja devolve o JSON pronto (ou lanca erro com a mensagem da API)
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  // 204 No Content nao tem corpo para converter em JSON
  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao comunicar com o servidor.');
  }
  return data;
}

// Atualiza os icones de usuario/carrinho/favoritos da navbar conforme login.
// Chamado em toda pagina que tem a navbar padrao do tema.
function updateAuthIcon() {
  const userIcon = document.querySelector('.header .icons a[href="login.html"]');
  if (!userIcon) return;

  const user = getUser();
  if (user) {
    userIcon.title = `Ola, ${user.name} (clique para sair)`;
    userIcon.addEventListener('click', (e) => {
      e.preventDefault();
      clearSession();
      window.location.href = 'index.html';
    });
  }
}

document.addEventListener('DOMContentLoaded', updateAuthIcon);

// ---------------------------------------------------------------------
// Toast: notificacao rapida no canto da tela (ex.: "produto adicionado
// ao carrinho"). Usado por products.js, cart.js e favorites.js.
// ---------------------------------------------------------------------
function ensureToastContainer() {
  let container = document.getElementById('app-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'app-toast-container';
    container.style.cssText = [
      'position:fixed', 'top:9rem', 'right:2rem', 'z-index:99999',
      'display:flex', 'flex-direction:column', 'gap:1rem',
      'max-width:32rem',
    ].join(';');
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type = 'success') {
  const container = ensureToastContainer();

  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = [
    `background:${type === 'error' ? '#e84393' : '#27ae60'}`,
    'color:#fff',
    'padding:1.2rem 1.8rem',
    'border-radius:.5rem',
    'font-size:1.5rem',
    'box-shadow:0 .5rem 1.5rem rgba(0,0,0,.2)',
    'opacity:0',
    'transform:translateX(2rem)',
    'transition:opacity .3s ease, transform .3s ease',
  ].join(';');

  container.appendChild(toast);

  // pequeno delay para o navegador registrar o estado inicial antes de animar
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(2rem)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
