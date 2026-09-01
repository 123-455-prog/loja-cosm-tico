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

// favoritos reais, vindos da API (GET /api/favorites)
let favoriteItems = [];

const favoritesGrid = document.getElementById('favorites-grid');
const favoritesEmptyMessage = document.getElementById('favorites-empty');
const favoritesMessage = document.getElementById('favorites-message');

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

// precisa estar logado para ter favoritos
if (!isLoggedIn()) {
  window.location.href = 'login.html';
}

async function loadFavorites() {
  try {
    const data = await apiFetch('/favorites');
    favoriteItems = data.items;
    renderFavorites();
  } catch (err) {
    favoritesMessage.textContent = err.message;
  }
}

function renderFavorites() {
  favoritesGrid.innerHTML = '';

  favoritesEmptyMessage.classList.toggle('active', favoriteItems.length === 0);

  favoriteItems.forEach((item) => {
    const card = document.createElement('div');
    card.classList.add('favorite-card');
    card.innerHTML = `
      <div class="image">
        <img src="${item.image || 'images/product-1.jpg'}" alt="">
        <button class="remove-btn fas fa-times" type="button"></button>
      </div>
      <div class="content">
        <h3>${item.name}</h3>
        <span class="price">${formatPrice(item.price)}</span>
        <button class="btn move-to-cart-btn" type="button">mover para o carrinho</button>
      </div>
    `;

    // o backend identifica o favorito pelo id do produto (product_id)
    card.querySelector('.remove-btn').onclick = () => removeFavorite(item.product_id);
    card.querySelector('.move-to-cart-btn').onclick = () => moveToCart(item.product_id);

    favoritesGrid.appendChild(card);
  });
}

async function removeFavorite(productId) {
  try {
    const data = await apiFetch(`/favorites/${productId}`, { method: 'DELETE' });
    favoriteItems = data.items;
    favoritesMessage.textContent = '';
    showToast('Produto removido dos favoritos.');
    renderFavorites();
  } catch (err) {
    favoritesMessage.textContent = err.message;
    showToast(err.message, 'error');
  }
}

async function moveToCart(productId) {
  try {
    await apiFetch('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity: 1 }),
    });
    await apiFetch(`/favorites/${productId}`, { method: 'DELETE' });
    favoriteItems = favoriteItems.filter((i) => i.product_id !== productId);
    favoritesMessage.style.color = '#2ecc71';
    favoritesMessage.textContent = 'Produto movido para o carrinho!';
    showToast('Produto movido para o carrinho!');
    renderFavorites();
  } catch (err) {
    favoritesMessage.style.color = '#e84393';
    favoritesMessage.textContent = err.message;
    showToast(err.message, 'error');
  }
}

loadFavorites();
