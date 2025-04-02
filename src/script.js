document.addEventListener('DOMContentLoaded', function() {
    const products = [
        { id: 1, name: 'Abacaxi', price: 33.00, image: 'assets/polpas/abacaxi.png', quantityType: '10 unid. 100g' },
        { id: 2, name: 'Abacaxi com Hortelã', price: 36.00, image: 'assets/polpas/abacaxichortela.png', quantityType: '10 unid. 100g' },
        { id: 3, name: 'Açaí', price: 38.00, image: 'assets/polpas/acai.png', quantityType: '10 unid. 100g' },
        { id: 4, name: 'Acerola', price: 27.00, image: 'assets/polpas/acerola.png', quantityType: '10 unid. 100g' },
        { id: 5, name: 'Acerola com Laranja', price: 32.00, image: 'assets/polpas/acerolaelaranja.png', quantityType: '10 unid. 100g' },
        { id: 6, name: 'Amora', price: 44.00, image: 'assets/polpas/amora.png', quantityType: '10 unid. 100g' },
        { id: 7, name: 'Cacau', price: 33.00, image: 'assets/polpas/cacau.png', quantityType: '10 unid. 100g' },
        { id: 8, name: 'Cajá', price: 34.00, image: 'assets/polpas/caja.png', quantityType: '10 unid. 100g' },
        { id: 9, name: 'Caju', price: 27.00, image: 'assets/polpas/caju.png', quantityType: '10 unid. 100g' },
        { id: 10, name: 'Coco Verde', price: 29.00, image: 'assets/polpas/coco.png', quantityType: '10 unid. 100g' },
        { id: 11, name: 'Cupuaçu <br>(indisponível)', price: 32.00, image: 'assets/polpas/cucuacu.png', quantityType: '10 unid. 100g' },
        { id: 12, name: 'Mix Beta', price: 29.90, image: 'assets/polpas/mixbeta.png', quantityType: '10 unid. 100g' },
        { id: 13, name: 'Mix Roxo', price: 36.00, image: 'assets/polpas/mixroxo.png', quantityType: '10 unid. 100g', description: `
      <p>
        Polpa Mista de Uva, Morango, Maçã, Açaí, Beterraba e Gengibre. Ingredientes vindos das frutas e vegetais, na combinação perfeita para o equilíbrio do organismo.
        <br><strong>MINERAIS:</strong> Ácido Fólico | Cálcio | Cobre | Ferro | Fósforo | Magnésio | Manganês | Potássio | Selênio | Sódio | Zinco.
        <br><strong>VITAMINAS:</strong> A | B1 | B2 | B5 | B6 | C | D | E | K.
      </p>
      <h3>Embalagem Disponível:</h3>
      <p>Pacotes com 10 unidades de 100g (cx. 10kg)</p>
      <h3>Polpa Mix nº 2</h3>
      <p>Informação Nutricional: Porção de 100g:</p>
      <table>
        <thead>
          <tr>
            <th>Quantidade por porção</th>
            <th>%VD *</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Valor Energético: 53kcal = 223kJ</td>
            <td>3</td>
          </tr>
          <tr>
            <td>Carboidratos (g): 11</td>
            <td>4</td>
          </tr>
          <tr>
            <td>Proteínas (g): 0,8</td>
            <td>1</td>
          </tr>
          <tr>
            <td>Gorduras Totais (g): 0,6</td>
            <td>1</td>
          </tr>
          <tr>
            <td>Gorduras Saturadas (g): 0</td>
            <td>0</td>
          </tr>
          <tr>
            <td>Gorduras Trans (g): 0</td>
            <td>**</td>
          </tr>
          <tr>
            <td>Fibra Alimentar (g): 1,4</td>
            <td>6</td>
          </tr>
          <tr>
            <td>Sódio (mg): 7</td>
            <td>0</td>
          </tr>
        </tbody>
      </table>
      <p>
        Dados nutricionais obtidos através de literatura, conforme previsto na RDC n°360/2003.
        *%Valores diários com base em uma dieta de 2.000 kcal ou 8.400 kJ. Seus valores diários podem ser maiores ou menores dependendo de suas necessidades energéticas.
        **VD não estabelecido.
      </p>
    ` },
        { id: 14, name: 'Mix Verde', price: 36.00, image: 'assets/polpas/mixverde.png', quantityType: '10 unid. 100g' },
        { id: 15, name: 'Framboesa<br>(Sob Encomenda)', price: 64.00, image: 'assets/polpas/fraboesa.png', quantityType: 'Pacote 1Kg' },
        { id: 16, name: 'Frutas Vermelhas', price: 46.00, image: 'assets/polpas/frutasvermelhas.png', quantityType: '10 unid. 100g' },
        { id: 17, name: 'Goiaba', price: 27.00, image: 'assets/polpas/goiaba.png', quantityType: '10 unid. 100g' },
        { id: 18, name: 'Graviola', price: 32.00, image: 'assets/polpas/graviola.png', quantityType: '10 unid. 100g' },
        { id: 19, name: 'Kiwi', price: 27.00, image: 'assets/polpas/kiwi.png', quantityType: '10 unid. 100g' },
        { id: 20, name: 'Laranja', price: 34.00, image: 'assets/polpas/laranja.png', quantityType: '10 unid. 100g' },
        { id: 21, name: 'Limão', price: 27.00, image: 'assets/polpas/limao.png', quantityType: '10 unid. 100g' },
        { id: 22, name: 'Mamão com Laranja', price: 32.00, image: 'assets/polpas/mamaoelaranja.png', quantityType: '10 unid. 100g' },
        { id: 23, name: 'Manga', price: 27.00, image: 'assets/polpas/manga.png', quantityType: '10 unid. 100g' },
        { id: 24, name: 'Maracujá', price: 43.50, image: 'assets/polpas/maracuja.png', quantityType: '10 unid. 100g' },
        { id: 25, name: 'Melancia', price: 27.00, image: 'assets/polpas/melancia.png', quantityType: '10 unid. 100g' },
        { id: 26, name: 'Mista<br>(Sob Encomenda)', price: 27.00, image: 'assets/polpas/bananamamaomaca.png', quantityType: '10 unid. 100g' },
        { id: 27, name: 'Morango', price: 29.00, image: 'assets/polpas/morango.png', quantityType: '10 unid. 100g' },
        { id: 28, name: 'Pêssego', price: 32.00, image: 'assets/polpas/pessego.png', quantityType: '10 unid. 100g' },
        { id: 30, name: 'Pão de Queijo<br>(Sob Encomenda)', price: 79.00, image: 'assets/paodequeijo.png', quantityType: 'Balde 4 Kg' },
        { id: 31, name: 'Tamarindo', price: 27.00, image: 'assets/polpas/tamarindo.png', quantityType: '10 unid. 100g' },
        { id: 32, name: 'Tangerina<br>(Sob Encomenda)', price: 34.00,image: 'assets/polpas/tangeirna.png', quantityType: 'Pacote 1Kg'},
        { id: 33, name: 'Umbu', price: 32.00, image: 'assets/polpas/umbu.png', quantityType: '10 unid. 100g' },
        { id: 34, name: 'Uva', price: 32.00, image: 'assets/polpas/uva.png', quantityType: '10 unid. 100g' },
        { id: 35, name: 'Açaí tradicional<br>com Guaraná', price: 39.90, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/acai_1600g_tradicional_128x171.png', quantityType: 'Pote 1,6 Kg' },
        { id: 36, name: 'Amora Congelada', price: 49.90, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/fruta-cong-amora-2.png', quantityType: 'Pacote 1,02 Kg' },
        { id: 37, name: 'Mirtilo Congelado', price: 68.90, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/fruta-cong-blueberry-2.png', quantityType: 'Pacote 1,02 Kg' },
        { id: 38, name: 'Morango Congelado', price: 29.90, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/fruta-cong-morango-2.png', quantityType: 'Pacote 1,02 Kg' },
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
            // Adiciona o evento de clique na imagem para abrir o modal
            const productImage = productDiv.querySelector('img');
            productImage.style.cursor = 'pointer';
            productImage.addEventListener('click', function() {
                openProductModal(product.id);
            });
            productList.appendChild(productDiv);
        });
    }
    
    // Função para abrir o modal de detalhes do produto
    function openProductModal(productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
            document.getElementById('modalProductImage').src = product.image;
            document.getElementById('modalProductImage').alt = product.name;
            document.getElementById('modalProductName').innerHTML = product.name;
            document.getElementById('modalProductPrice').textContent = `R$ ${product.price.toFixed(2)}`;
            document.getElementById('modalProductQuantity').textContent = product.quantityType;
            
            // Insere a descrição do produto
            const descriptionContainer = document.getElementById('modalProductDescription');
            descriptionContainer.innerHTML = product.description || '';
    
            // Configura o botão "Adicionar ao Carrinho" do modal
            const modalAddToCart = document.getElementById('modalAddToCart');
            modalAddToCart.onclick = function() {
                addToCart(product.id);
                closeProductModal();
            };
    
            document.getElementById('productModal').style.display = 'flex';
        }
    }
    // Função para fechar o modal
    function closeProductModal() {
        document.getElementById('productModal').style.display = 'none';
    }

    // Evento para fechar o modal ao clicar no "X"
    document.getElementById('closeProductModal').addEventListener('click', closeProductModal);

    // (Opcional) Fecha o modal se o usuário clicar fora do conteúdo do modal
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('productModal');
        if (event.target === modal) {
            closeProductModal();
        }
    });

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
          // Exibe a mensagem de carrinho vazio
          cartItems.innerHTML = '<p id="emptyCartMessage">Seu carrinho está vazio.</p>';
        } else {
          cart.forEach((item, index) => {
            const cartItemDiv = document.createElement('div');
            cartItemDiv.classList.add('cart-item');
            
            // Exemplo com imagem do produto
            cartItemDiv.innerHTML = `
              <img src="${item.image}" alt="${item.name}" class="cart-item-img">
              <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p>R$ ${item.price.toFixed(2)}</p>
              </div>
              <div class="cart-item-quantity">
                <button onclick="increaseQuantity(${index})">+</button>
                <span>${item.quantity}</span>
                <button onclick="decreaseQuantity(${index})">-</button>
              </div>
              <button class="remove-item" onclick="removeItem(${index})">🗑️</button>
            `;
      
            cartItems.appendChild(cartItemDiv);
          });
        }
      
        // Calcula o total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('cartTotal').textContent = `Total: R$ ${total.toFixed(2)}`;
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

    // document.getElementById('closeCart').addEventListener('click', function() {
    //     cartModal.style.display = 'none';
    // });
    cartModal.addEventListener('click', function(event) {
        if (event.target === cartModal) {
            cartModal.style.display = 'none';
        }
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
