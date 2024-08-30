document.addEventListener('DOMContentLoaded', function() {
    const products = [
        { id: 1, name: 'Abacaxi', price: 33.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-abacaxi-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 2, name: 'Abacaxi com Hortelã', price: 36.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-abacaxi-hortela-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 3, name: 'Açaí', price: 38.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-acai-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 4, name: 'Acerola', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-acerola-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 5, name: 'Acerola com Laranja', price: 30.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-acerola-laranja-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 6, name: 'Amora', price: 44.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-amora-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 7, name: 'Cacau', price: 33.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-cacau-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 8, name: 'Cajá', price: 34.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-caja-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 9, name: 'Caju', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-caju-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 10, name: 'Coco Verde', price: 29.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-coco-verde-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 11, name: 'Cupuaçu', price: 32.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-cupuacu-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 12, name: 'Detox Laranja', price: 36.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa_mix_n3_128x171.png', quantityType: 'Pacote 1 Kg' },
        { id: 13, name: 'Detox Roxo', price: 36.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa_mix_n2_128x171.png', quantityType: 'Pacote 1 Kg' },
        { id: 14, name: 'Detox Verde', price: 36.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa_mix_n1_128x171.png', quantityType: 'Pacote 1 Kg' },
        { id: 15, name: 'Framboesa<br>(Sob Encomenda)', price: 64.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-framboesa-2.png', quantityType: 'Pacote 1Kg' },
        { id: 16, name: 'Frutas Vermelhas', price: 46.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-frutas-vermelhas-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 17, name: 'Goiaba', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-goiaba-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 18, name: 'Graviola', price: 32.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-graviola-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 19, name: 'Kiwi', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-kiwi-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 20, name: 'Laranja', price: 30.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-laranja-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 21, name: 'Limão', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-limao-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 22, name: 'Mamão com Laranja', price: 30.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-mamao-laranja-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 23, name: 'Manga', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-manga-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 24, name: 'Maracujá', price: 43.50, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-maracuja-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 25, name: 'Melancia', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-melancia-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 26, name: 'Mista<br>(Sob Encomenda)', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-banana-mamao-maca-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 27, name: 'Morango', price: 29.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-morango-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 28, name: 'Pêssego', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-pessego-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 30, name: 'Pão de Queijo<br>(Sob Encomenda)', price: 79.00, image: 'assets/paodequeijo.png', quantityType: 'Balde 4 Kg' },
        { id: 31, name: 'Tamarindo', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-tamarindo-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 32, name: 'Tangerina<br>(Sob Encomenda)', price: 27.00,image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-tangerina-2.png', quantityType: 'Pacote 1Kg'},
        { id: 33, name: 'Umbu', price: 27.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-umbu-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 34, name: 'Uva', price: 31.50, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/polpa-fruta-cong-uva-2.png', quantityType: 'Pacote 1 Kg' },
        { id: 35, name: 'Açaí tradicional<br>com Guaraná', price: 39.90, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/acai_1600g_tradicional_128x171.png', quantityType: 'Pote 1,6 Kg' },
        { id: 36, name: 'Amora Congelada', price: 49.90, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/fruta-cong-amora-2.png', quantityType: 'Pacote 1,02 Kg' },
        { id: 37, name: 'Mirtilo Congelado', price: 68.90, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/fruta-cong-blueberry-2.png', quantityType: 'Pacote 1,02 Kg' },
        { id: 38, name: 'Morango Congelado', price: 28.90, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/fruta-cong-morango-2.png', quantityType: 'Pacote 1,02 Kg' },
        { id: 40, name: 'Framboesa Congelada<br>(Sob Encomenda)', price: 78.50, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/fruta-cong-framboesa-2.png', quantityType: 'Pacote 1,02 Kg' }
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
                <p class="kilo">(${product.quantityType})</p>
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
