// comportamento do header/navbar (igual ao script.js do site)
let navbar = document.querySelector('.navbar');

document.querySelector('#menu-btn').onclick = () => {
  navbar.classList.toggle('active');
};

document.querySelector('#close-navbar').onclick = () => {
  navbar.classList.remove('active');
};

let searchForm = document.querySelector('.search-form');

document.querySelector('#search-btn').onclick = () => {
  searchForm.classList.toggle('active');
};

window.onscroll = () => {
  navbar.classList.remove('active');
  searchForm.classList.remove('active');
};

// alternância entre os formularios de login e cadastro
const tabBtns = document.querySelectorAll('.tab-btn');
const authForms = document.querySelectorAll('.auth-form');
const formMessage = document.getElementById('form-message');

function switchTab(target) {
  tabBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === target));
  authForms.forEach((form) => form.classList.toggle('active', form.id === `${target}-form`));
  formMessage.textContent = '';
}

tabBtns.forEach((btn) => {
  btn.onclick = () => switchTab(btn.dataset.tab);
});

document.querySelectorAll('[data-switch]').forEach((link) => {
  link.onclick = (e) => {
    e.preventDefault();
    switchTab(link.dataset.switch);
  };
});

function showMessage(text, isError = true) {
  formMessage.style.color = isError ? '#e84393' : '#2ecc71';
  formMessage.textContent = text;
}

// se ja estiver logado, manda direto pra loja
if (isLoggedIn()) {
  window.location.href = 'index.html';
}

// login real -> POST /api/auth/login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    saveSession(data.token, data.user);
    showMessage(`Bem-vindo(a), ${data.user.name}! Redirecionando...`, false);
    setTimeout(() => { window.location.href = 'index.html'; }, 800);
  } catch (err) {
    showMessage(err.message);
  }
});

// cadastro real -> POST /api/auth/register
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const repeatPassword = document.getElementById('register-repeat-password').value;

  if (password !== repeatPassword) {
    showMessage('As senhas nao coincidem.');
    return;
  }

  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    saveSession(data.token, data.user);
    showMessage(`Conta criada com sucesso, ${data.user.name}! Redirecionando...`, false);
    setTimeout(() => { window.location.href = 'index.html'; }, 800);
  } catch (err) {
    showMessage(err.message);
  }
});
