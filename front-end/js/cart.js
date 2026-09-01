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

// carrinho real, vindo da API (GET /api/cart)
let cartItems = [];

const cartItemsBox = document.getElementById('cart-items');
const cartEmptyMessage = document.getElementById('cart-empty');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const cartTotalEl = document.getElementById('cart-total');
const cartMessage = document.getElementById('cart-message');

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

// precisa estar logado para ter carrinho
if (!isLoggedIn()) {
  window.location.href = 'login.html';
}

async function loadCart() {
  try {
    const data = await apiFetch('/cart');
    cartItems = data.items;
    renderCart();
  } catch (err) {
    cartMessage.textContent = err.message;
  }
}

function renderCart() {
  cartItemsBox.innerHTML = '';

  cartEmptyMessage.classList.toggle('active', cartItems.length === 0);

  let subtotal = 0;

  cartItems.forEach((item) => {
    subtotal += item.subtotal;

    const row = document.createElement('div');
    row.classList.add('cart-item');
    row.innerHTML = `
      <img src="${item.image || 'images/product-1.jpg'}" alt="">
      <div class="cart-item-info">
        <h3>${item.name}</h3>
        <p class="price">${formatPrice(item.price)}</p>
      </div>
      <div class="qty-box">
        <button class="qty-btn minus" type="button">-</button>
        <input class="qty-input" type="number" min="1" max="${item.stock}" value="${item.quantity}">
        <button class="qty-btn plus" type="button">+</button>
      </div>
      <div class="item-subtotal">${formatPrice(item.subtotal)}</div>
      <button class="remove-btn fas fa-trash" type="button"></button>
    `;

    row.querySelector('.minus').onclick = () => updateQty(item.id, item.quantity - 1);
    row.querySelector('.plus').onclick = () => updateQty(item.id, item.quantity + 1);
    row.querySelector('.qty-input').onchange = (e) => updateQty(item.id, Number(e.target.value));
    row.querySelector('.remove-btn').onclick = () => removeItem(item.id);

    cartItemsBox.appendChild(row);
  });

  cartSubtotalEl.textContent = formatPrice(subtotal);
  cartTotalEl.textContent = formatPrice(subtotal);
}

async function updateQty(id, qty) {
  if (qty < 1) qty = 1;
  try {
    const data = await apiFetch(`/cart/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity: qty }),
    });
    cartItems = data.items;
    cartMessage.textContent = '';
    renderCart();
  } catch (err) {
    cartMessage.textContent = err.message;
  }
}

async function removeItem(id) {
  try {
    const data = await apiFetch(`/cart/${id}`, { method: 'DELETE' });
    cartItems = data.items;
    showToast('Produto removido do carrinho.');
    renderCart();
  } catch (err) {
    cartMessage.textContent = err.message;
    showToast(err.message, 'error');
  }
}

document.getElementById('checkout-btn').onclick = async () => {
  if (cartItems.length === 0) {
    cartMessage.textContent = 'Seu carrinho esta vazio.';
    return;
  }
  try {
    const data = await apiFetch('/orders', { method: 'POST' });
    cartMessage.style.color = '#2ecc71';
    cartMessage.textContent = `Pedido #${data.order.id} finalizado com sucesso!`;
    showToast(`Pedido #${data.order.id} finalizado com sucesso!`);
    cartItems = [];
    renderCart();
  } catch (err) {
    cartMessage.style.color = '#e84393';
    cartMessage.textContent = err.message;
    showToast(err.message, 'error');
  }
};

loadCart();
