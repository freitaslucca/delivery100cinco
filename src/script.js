document.addEventListener('DOMContentLoaded', function() {
    const products = [
        { id: 1, name: 'Abacaxi', price: 33.00, image: 'assets/polpas/abacaxi.png', quantityType: '10 unid. 100g' },
        { id: 2, name: 'Abacaxi com Hortelã', price: 36.00, image: 'assets/polpas/abacaxichortela.png', quantityType: '10 unid. 100g' },
        { id: 3, name: 'Açaí', price: 38.00, image: 'assets/polpas/acai.png', quantityType: '10 unid. 100g' },
        { id: 4, name: 'Acerola', price: 27.00, image: 'assets/polpas/acerola.png', quantityType: '10 unid. 100g' },
        { id: 5, name: 'Acerola com Laranja', price: 30.00, image: 'assets/polpas/acerolaelaranja.png', quantityType: '10 unid. 100g' },
        { id: 6, name: 'Amora', price: 44.00, image: 'assets/polpas/amora.png', quantityType: '10 unid. 100g' },
        { id: 7, name: 'Cacau', price: 33.00, image: 'assets/polpas/cacau.png', quantityType: '10 unid. 100g' },
        { id: 8, name: 'Cajá', price: 34.00, image: 'assets/polpas/caja.png', quantityType: '10 unid. 100g' },
        { id: 9, name: 'Caju', price: 27.00, image: 'assets/polpas/caju.png', quantityType: '10 unid. 100g' },
        { id: 10, name: 'Coco Verde', price: 29.00, image: 'assets/polpas/coco.png', quantityType: '10 unid. 100g' },
        { id: 11, name: 'Cupuaçu', price: 32.00, image: 'assets/polpas/cucuacu.png', quantityType: '10 unid. 100g' },
        { id: 12, name: 'Mix Beta', price: 36.00, image: 'assets/polpas/mixbeta.png', quantityType: '10 unid. 100g' },
        { id: 13, name: 'Mix Roxo', price: 36.00, image: 'assets/polpas/mixroxo.png', quantityType: '10 unid. 100g' },
        { id: 14, name: 'Mix Verde', price: 36.00, image: 'assets/polpas/mixverde.png', quantityType: '10 unid. 100g' },
        { id: 15, name: 'Framboesa<br>(Sob Encomenda)', price: 64.00, image: 'assets/polpas/fraboesa.png', quantityType: 'Pacote 1Kg' },
        { id: 16, name: 'Frutas Vermelhas', price: 46.00, image: 'assets/polpas/frutasvermelhas.png', quantityType: '10 unid. 100g' },
        { id: 17, name: 'Goiaba', price: 27.00, image: 'assets/polpas/goiaba.png', quantityType: '10 unid. 100g' },
        { id: 18, name: 'Graviola', price: 32.00, image: 'assets/polpas/graviola.png', quantityType: '10 unid. 100g' },
        { id: 19, name: 'Kiwi', price: 27.00, image: 'assets/polpas/kiwi.png', quantityType: '10 unid. 100g' },
        { id: 20, name: 'Laranja', price: 30.00, image: 'assets/polpas/laranja.png', quantityType: '10 unid. 100g' },
        { id: 21, name: 'Limão', price: 27.00, image: 'assets/polpas/limao.png', quantityType: '10 unid. 100g' },
        { id: 22, name: 'Mamão com Laranja', price: 30.00, image: 'assets/polpas/mamaoelaranja.png', quantityType: '10 unid. 100g' },
        { id: 23, name: 'Manga', price: 27.00, image: 'assets/polpas/manga.png', quantityType: '10 unid. 100g' },
        { id: 24, name: 'Maracujá', price: 43.50, image: 'assets/polpas/maracuja.png', quantityType: '10 unid. 100g' },
        { id: 25, name: 'Melancia', price: 27.00, image: 'assets/polpas/melancia.png', quantityType: '10 unid. 100g' },
        { id: 26, name: 'Mista<br>(Sob Encomenda)', price: 27.00, image: 'assets/polpas/bananamamaomaca.png', quantityType: '10 unid. 100g' },
        { id: 27, name: 'Morango', price: 29.00, image: 'assets/polpas/morango.png', quantityType: '10 unid. 100g' },
        { id: 28, name: 'Pêssego', price: 32.00, image: 'assets/polpas/pessego.png', quantityType: '10 unid. 100g' },
        { id: 30, name: 'Pão de Queijo<br>(Sob Encomenda)', price: 79.00, image: 'assets/paodequeijo.png', quantityType: 'Balde 4 Kg' },
        { id: 31, name: 'Tamarindo', price: 27.00, image: 'assets/polpas/tamarindo.png', quantityType: '10 unid. 100g' },
        { id: 32, name: 'Tangerina<br>(Sob Encomenda)', price: 30.00,image: 'assets/polpas/tangeirna.png', quantityType: 'Pacote 1Kg'},
        { id: 33, name: 'Umbu', price: 32.00, image: 'assets/polpas/umbu.png', quantityType: '10 unid. 100g' },
        { id: 34, name: 'Uva', price: 32.00, image: 'assets/polpas/uva.png', quantityType: '10 unid. 100g' },
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
                <h3 class = "productName">${product.name}</h3>
                <p class="price">R$ ${product.price.toFixed(2)}</p>
                <p class="kilo">(${product.quantityType})</p>
                <button onclick="addToCart(${product.id})">adicionar ao carrinho</button>
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
        console.log("!!!!!!!!!!!!!!")
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
