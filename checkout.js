document.addEventListener('DOMContentLoaded', function() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const orderItems = document.getElementById('orderItems');
    const orderTotal = document.getElementById('orderTotal');
    const deliveryFeeMessage = document.getElementById('deliveryFeeMessage');

    function renderOrderSummary() {
        let total = 0;
        orderItems.innerHTML = '';
        cart.forEach((item, index) => {
            const orderItem = document.createElement('li');
            orderItem.innerHTML = `
                <span>${item.quantity} x ${item.name} - R$ ${(item.quantity * item.price).toFixed(2)}</span>
                <div class="order-item-controls">
                    <button onclick="removeItem(${index})"><span class="icon-trash">🗑️</span></button>
                    <button class="quantity-control" onclick="increaseQuantity(${index})">+</button>
                    <button class="quantity-control" onclick="decreaseQuantity(${index})">-</button>
                </div>
            `;
            orderItems.appendChild(orderItem);
            total += item.quantity * item.price;
        });
        orderTotal.textContent = total.toFixed(2);
    }

    window.removeItem = function(index) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        renderOrderSummary();
    };

    window.increaseQuantity = function(index) {
        cart[index].quantity++;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderOrderSummary();
    };

    window.decreaseQuantity = function(index) {
        if (cart[index].quantity > 1) {
            cart[index].quantity--;
            localStorage.setItem('cart', JSON.stringify(cart));
            renderOrderSummary();
        }
    };

    function updateDeliveryFee(city) {
        if (city.toLowerCase() === 'brusque' || city.toLowerCase() === 'guabiruba') {
            deliveryFeeMessage.textContent = 'A taxa de entrega é R$ 7,00.';
        } else {
            deliveryFeeMessage.textContent = 'Para outras regiões, consulte o valor da taxa de entrega via WhatsApp.';
        }
    }

    document.getElementById('city').addEventListener('input', function() {
        updateDeliveryFee(this.value);
    });

    document.getElementById('checkoutForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const fullName = document.getElementById('fullName').value;
        const cep = document.getElementById('cep').value;
        const address = document.getElementById('address').value;
        const number = document.getElementById('number').value;
        const complement = document.getElementById('complement').value;
        const city = document.getElementById('city').value;
        const deliveryDate = document.getElementById('deliveryDate').value;
        const phone = document.getElementById('phone').value;
        const payment = document.getElementById('payment').value;

        const total = parseFloat(orderTotal.textContent);
        if (total <= 0) {
            alert("Seu pedido está vazio, adicione um produto para finalizar a compra."); // Adicionado
            return;
        }

        const orderSummary = cart.map(item => `${item.quantity} x ${item.name} - R$ ${item.price.toFixed(2)}`).join('\n');
        const deliveryFee = city.toLowerCase() === 'brusque' || city.toLowerCase() === 'guabiruba' ? 7 : 'Consultar via WhatsApp';
        const finalTotal = typeof deliveryFee === 'number' ? total + deliveryFee : total;
        const deliveryFeeText = typeof deliveryFee === 'number' ? `Taxa de entrega: R$ ${deliveryFee.toFixed(2)}` : deliveryFee;

        const fullOrderSummary = `Nome: ${fullName}\nCEP: ${cep}\nEndereço: ${address}, Número: ${number}, Complemento: ${complement}\nCidade: ${city}\nTelefone: ${phone}\nForma de Pagamento: ${payment}\nData de Entrega: ${deliveryDate}\n\nPedido:\n${orderSummary}\nTotal: R$ ${total.toFixed(2)}\n${deliveryFeeText}\nTotal Final: R$ ${finalTotal.toFixed(2)}`;

        const whatsappUrl = `https://wa.me/+554792501005?text=${encodeURIComponent(fullOrderSummary)}`;
        window.location.href = whatsappUrl;

        // Esvaziar o carrinho após confirmar o pedido
        localStorage.removeItem('cart');
    });

    document.getElementById('cep').addEventListener('blur', function() {
        const cep = this.value;
        if (cep.length === 8) {
            fetch(`https://viacep.com.br/ws/${cep}/json/`)
                .then(response => response.json())
                .then(data => {
                    if (!data.erro) {
                        document.getElementById('address').value = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
                        document.getElementById('city').value = data.localidade;
                        updateDeliveryFee(data.localidade);
                    }
                })
                .catch(error => console.error('Erro ao buscar o CEP:', error));
        }
    });

    renderOrderSummary();
});
