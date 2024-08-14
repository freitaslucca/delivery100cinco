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
            deliveryFeeMessage.textContent = 'Investimento de entrega: R$ 7,00.';
        } else {
            deliveryFeeMessage.textContent = 'Para outras regiões, consulte o valor da taxa de entrega via WhatsApp.';
        }
    }

    document.getElementById('city').addEventListener('input', function() {
        updateDeliveryFee(this.value);
    });

    document.getElementById('checkoutForm').addEventListener('submit', async function(e) {
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
            alert("Seu pedido está vazio, adicione um produto para finalizar a compra.");
            return;
        }

        const orderData = {
            orderNumber: Date.now(), // Ou outro identificador único
            customerName: fullName,
            deliveryDate: new Date(deliveryDate),
            items: cart.map(item => `${item.quantity} x ${item.name}`),
            address: `${address}, ${number}, ${complement}, ${city}`,
            status: 'Pendente',
            payment: `${payment}`,
            total: `${total}`
        };

        // Enviar pedido para o MongoDB
        try {
            await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
        } catch (error) {
            console.error('Erro ao salvar pedido no banco de dados:', error);
        }

        // Enviar pedido para o WhatsApp
        const orderSummary = cart.map(item => `${item.quantity} x ${item.name} - R$ ${item.price.toFixed(2)}`).join('\n');
        const deliveryFee = city.toLowerCase() === 'brusque' || city.toLowerCase() === 'guabiruba' ? 7 : 'Consultar via WhatsApp';
        const finalTotal = typeof deliveryFee === 'number' ? total + deliveryFee : total;
        const deliveryFeeText = typeof deliveryFee === 'number' ? `Investimento de entrega: R$ ${deliveryFee.toFixed(2)}` : deliveryFee;

        const fullOrderSummary = `*Novo pedido!*\n*Nome:* ${fullName}\n*CEP:* ${cep}\n*Endereço:* ${address}, Número: ${number}\n*Complemento:* ${complement}\n*Cidade:* ${city}\n*Telefone:* ${phone}\n\n*Pedido:*\n${orderSummary}\n\n*Forma de Pagamento:* ${payment}\n${deliveryFeeText}\n*Total Final:* R$ ${finalTotal.toFixed(2)}`;

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
