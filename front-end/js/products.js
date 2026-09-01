// Passo 3 (produtos) + integra com Passo 4 (carrinho) e Passo 5 (favoritos)
// Busca os produtos reais da API e substitui TODAS as grades fixas de produtos
// do index.html (secao "featured products" e secao "new arrivals").

const productsWrapper = document.querySelector('.shop .products-slider .swiper-wrapper');
const arrivalsWrapper = document.querySelector('.arrivals .arrivals-slider .swiper-wrapper');

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

// card usado na secao "featured products" (tem icone de carrinho e de favoritos)
function productCard(product) {
  const slide = document.createElement('div');
  slide.classList.add('swiper-slide', 'slide');
  slide.innerHTML = `
    <div class="image">
      <img src="${product.image || 'images/product-1.jpg'}" alt="${product.name}">
      <div class="icons">
        <a href="#" class="fas fa-shopping-cart add-to-cart"></a>
        <a href="#" class="fas fa-heart add-to-favorites"></a>
      </div>
    </div>
    <div class="content">
      <p>${product.name}</p>
      <div class="price">${formatPrice(product.price)}</div>
    </div>
  `;

  slide.querySelector('.add-to-cart').onclick = (e) => { e.preventDefault(); addToCart(e.target, product.id); };
  slide.querySelector('.add-to-favorites').onclick = (e) => { e.preventDefault(); addToFavorites(e.target, product.id); };

  return slide;
}

// card usado na secao "new arrivals" (tem botao "add to cart" em texto)
function arrivalCard(product) {
  const slide = document.createElement('div');
  slide.classList.add('swiper-slide', 'slide');
  slide.innerHTML = `
    <div class="image">
      <img src="${product.image || 'images/product-1.jpg'}" alt="${product.name}">
    </div>
    <div class="content">
      <p>${product.name}</p>
      <div class="price">${formatPrice(product.price)}</div>
      <a href="#" class="btn add-to-cart">add to cart</a>
    </div>
  `;

  slide.querySelector('.add-to-cart').onclick = (e) => { e.preventDefault(); addToCart(e.target, product.id, true); };

  return slide;
}

async function addToCart(el, productId, isTextBtn = false) {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
  try {
    await apiFetch('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity: 1 }),
    });
    if (isTextBtn) {
      el.textContent = 'adicionado!';
      setTimeout(() => { el.textContent = 'add to cart'; }, 1500);
    } else {
      el.classList.add('active');
    }
    showToast('Produto adicionado ao carrinho!');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function addToFavorites(el, productId) {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
  try {
    await apiFetch('/favorites', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    });
    el.classList.add('active');
    showToast('Produto adicionado aos favoritos!');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadProducts() {
  if (!productsWrapper && !arrivalsWrapper) return;

  let products = [];
  try {
    const data = await apiFetch('/products');
    products = data.products;
  } catch (err) {
    console.error('Nao foi possivel carregar os produtos:', err.message);
  }

  if (productsWrapper) {
    productsWrapper.innerHTML = '';
    products.forEach((product) => productsWrapper.appendChild(productCard(product)));

    new Swiper('.shop .products-slider', {
      loop: true,
      grabCursor: true,
      spaceBetween: 20,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      breakpoints: {
        0: { slidesPerView: 1 },
        550: { slidesPerView: 2 },
        850: { slidesPerView: 3 },
        1200: { slidesPerView: 4 },
      },
    });
  }

  if (arrivalsWrapper) {
    // mostra os lancamentos mais recentes (produtos com maior id)
    const arrivals = [...products].slice(0, 8);
    arrivalsWrapper.innerHTML = '';
    arrivals.forEach((product) => arrivalsWrapper.appendChild(arrivalCard(product)));

    new Swiper('.arrivals .arrivals-slider', {
      loop: true,
      grabCursor: true,
      spaceBetween: 20,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      breakpoints: {
        0: { slidesPerView: 1 },
        550: { slidesPerView: 2 },
        850: { slidesPerView: 3 },
        1200: { slidesPerView: 4 },
      },
    });
  }
}

document.addEventListener('DOMContentLoaded', loadProducts);
