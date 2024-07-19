document.addEventListener('DOMContentLoaded', function() {
const products = [
    { id: 1, name: 'Abacaxi', price: 33.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-abacaxi-2.png' },
    { id: 2, name: 'Abacaxi com Hortelã', price: 36.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-abacaxi-hortela-2.png' },
    { id: 3, name: 'Açaí', price: 34.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-acai-2.png' },
    { id: 4, name: 'Acerola', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-acerola-2.png' },
    { id: 5, name: 'Acerola com Laranja', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-acerola-laranja-2.png' },
    { id: 6, name: 'Amora', price: 44.90, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-amora-2.png' },
    { id: 7, name: 'Cacau', price: 33.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-cacau-2.png' },
    { id: 8, name: 'Cajá', price: 33.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-caja-2.png' },
    { id: 9, name: 'Caju', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-caju-2.png' },
    { id: 10, name: 'Coco Verde', price: 29.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-coco-verde-2.png' },
    { id: 11, name: 'Cupuaçu', price: 29.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-cupuacu-2.png' },
    { id: 12, name: 'Frutas Vermelhas', price: 46.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-frutas-vermelhas-2.png' },
    { id: 13, name: 'Goiaba', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-goiaba-2.png' },
    { id: 14, name: 'Graviola', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-graviola-2.png' },
    { id: 15, name: 'Kiwi', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-kiwi-2.png' },
    { id: 16, name: 'Laranja', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-laranja-2.png' },
    { id: 17, name: 'Limão', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-limao-2.png' },
    { id: 18, name: 'Mamão com Laranja', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-mamao-laranja-2.png' },
    { id: 19, name: 'Manga', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-manga-2.png' },
    { id: 20, name: 'Maracujá', price: 43.50, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-maracuja-2.png' },
    { id: 21, name: 'Melancia', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-melancia-2.png' },
    { id: 22, name: 'Mista', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-mista-2.png' },
    { id: 23, name: 'Mix Detox Laranja', price: 39.90, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-mix-detox-laranja-2.png' },
    { id: 24, name: 'Mix Detox Roxo', price: 39.90, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-mix-detox-roxo-2.png' },
    { id: 25, name: 'Mix Detox Verde', price: 39.90, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-mix-detox-verde-2.png' },
    { id: 26, name: 'Morango', price: 29.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-morango-2.png' },
    { id: 27, name: 'Pêssego', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-pessego-2.png' },
    { id: 28, name: 'Tamarindo', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-tamarindo-2.png' },
    { id: 29, name: 'Umbu', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-umbu-2.png' },
    { id: 30, name: 'Uva', price: 31.50, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-uva-2.png' }
];

    const productList = document.getElementById('productList');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const cartModal = document.getElementById('cartModal');
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartSummary = document.getElementById('cartSummary');
    const cartSummaryText = document.getElementById('cartSummaryText');
    const emptyCartMessage = document.getElementById('emptyCartMessage'); // Adicionado
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    function renderProducts(productsToRender) {
        productList.innerHTML = '';
        productsToRender.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.classList.add('product');
            productDiv.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="price">R$ ${product.price.toFixed(2)}</p>
                <p class="kilo">(Pacote 1 Kg)</p>
                <button onclick="addToCart(${product.id})">Adicionar ao Carrinho</button>
            `;
            productList.appendChild(productDiv);
        });
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    const searchProducts = debounce(function() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchTerm));
        renderProducts(filteredProducts);
    }, 300);

    searchButton.addEventListener('click', searchProducts);
    searchInput.addEventListener('keyup', searchProducts);

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
        if (cart.length === 0) {
            emptyCartMessage.style.display = 'block';
        } else {
            emptyCartMessage.style.display = 'none';
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
        if (cart.length === 0) {
            alert("Seu carrinho está vazio. Adicione produtos antes de finalizar o pedido."); // Adicionado
            return;
        }
        window.location.href = 'checkout.html';
    });

    document.getElementById('viewCartButton').addEventListener('click', function() {
        renderCart();
        cartModal.style.display = 'flex';
    });

    function updateCartSummary() {
        if (cart.length > 0) {
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0); // Total de unidades
            cartSummaryText.textContent = `Total sem a entrega: R$ ${total.toFixed(2)} / ${itemCount} item(s)`;
            cartSummary.style.display = 'flex';
        } else {
            cartSummary.style.display = 'none';
        }
    }

    renderProducts(products);
    updateCartCount();
    updateCartSummary();
});
