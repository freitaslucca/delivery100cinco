document.addEventListener('DOMContentLoaded', function() {
    const products = [
        { id: 1, name: 'Abacaxi', price: 34.9, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-abacaxi-2.png' },
        { id: 2, name: 'Abacaxi com Hortelã', price: 36, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-abacaxi-hortela-2.png' },
        { id: 3, name: 'Açaí', price: 34, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-acai-2.png' },
        { id: 4, name: 'Acerola', price: 27, image:'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-acerola-2.png'}
    ];

    const productList = document.getElementById('productList');
    const cartModal = document.getElementById('cartModal');
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartSummary = document.getElementById('cartSummary');
    const cartSummaryText = document.getElementById('cartSummaryText');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    function renderProducts() {
        products.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.classList.add('product');
            productDiv.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>R$ ${product.price.toFixed(2)}</p>
                <button onclick="addToCart(${product.id})">Adicionar ao Carrinho</button>
            `;
            productList.appendChild(productDiv);
        });
    }

    window.addToCart = function(productId) {
        const product = products.find(p => p.id === productId);
        const cartItem = cart.find(item => item.id === productId);

        if (cartItem) {
            cartItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        updateCartSummary();
    }

    function updateCartCount() {
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    function renderCart() {
        cartItems.innerHTML = '';
        cart.forEach((item, index) => {
            const cartItemDiv = document.createElement('div');
            cartItemDiv.classList.add('cart-item');
            cartItemDiv.innerHTML = `
                <span>${item.name} - ${item.quantity} x R$ ${item.price.toFixed(2)}</span>
                <div class="cart-item-controls">
                    <button onclick="increaseQuantity(${index})">+</button>
                    <button onclick="decreaseQuantity(${index})">-</button>
                    <button onclick="removeItem(${index})"><span class="icon-trash">🗑️</span></button>
                </div>
            `;
            cartItems.appendChild(cartItemDiv);
        });
    }

    window.increaseQuantity = function(index) {
        cart[index].quantity++;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        updateCartCount();
        updateCartSummary();
    }

    window.decreaseQuantity = function(index) {
        if (cart[index].quantity > 1) {
            cart[index].quantity--;
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCart();
            updateCartCount();
            updateCartSummary();
        }
    }

    window.removeItem = function(index) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        updateCartCount();
        updateCartSummary();
    }

    document.getElementById('cartLink').addEventListener('click', function(e) {
        e.preventDefault();
        renderCart();
        cartModal.style.display = 'flex';
    });

    document.getElementById('closeCart').addEventListener('click', function() {
        cartModal.style.display = 'none';
    });

    document.getElementById('checkoutButton').addEventListener('click', function() {
        window.location.href = 'checkout.html';
    });

    document.getElementById('viewCartButton').addEventListener('click', function() {
        renderCart();
        cartModal.style.display = 'flex';
    });

    function updateCartSummary() {
        if (cart.length > 0) {
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartSummaryText.textContent = `Total sem a entrega: R$ ${total.toFixed(2)} / ${cart.length} item(s)`;
            cartSummary.style.display = 'flex';
        } else {
            cartSummary.style.display = 'none';
        }
    }

    renderProducts();
    updateCartCount();
    updateCartSummary();
});