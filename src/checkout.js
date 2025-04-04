document.addEventListener('DOMContentLoaded', function () {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const orderItems = document.getElementById('orderItems');
    const orderTotal = document.getElementById('orderTotal');
    const deliveryFeeMessage = document.getElementById('deliveryFeeMessage');

    // Função para renderizar o resumo do pedido
    function renderOrderSummary() {
        orderItems.innerHTML = '';

        if (cart.length === 0) {
            orderItems.innerHTML = '<li><p style="text-align:center;">Seu carrinho está vazio.</p></li>';
            orderTotal.textContent = '0.00';
            return;
        }

        let totalPrice = 0;

        cart.forEach(item => {
            const itemSubtotal = item.price * item.quantity;
            totalPrice += itemSubtotal;

            const li = document.createElement('li');
            li.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div>
                  <h3>${item.name}</h3>
                  <p>R$ ${item.price.toFixed(2)}</p>
                </div>
                <div>
                  <p>Qtde: ${item.quantity}</p>
                </div>
                <div>
                  <p>R$ ${itemSubtotal.toFixed(2)}</p>
                </div>
            `;
            orderItems.appendChild(li);
        });

        orderTotal.textContent = totalPrice.toFixed(2);
    }

    renderOrderSummary();

    // Função para redirecionar para a página de sucesso
    function redirectToSuccessPage() {
        const total = parseFloat(document.getElementById('orderTotal').textContent);
        if (total > 0) {
            localStorage.removeItem('cart');
            window.location.href = 'pedido-sucesso.html';
        } else {
            alert("Seu pedido está vazio, adicione um produto para finalizar a compra.");
        }
    }

    // Carregar dados do cliente do localStorage
    function loadCustomerData() {
        const customerData = JSON.parse(localStorage.getItem('customerData'));
        if (customerData) {
            document.getElementById('fullName').value = customerData.fullName || '';
            document.getElementById('cep').value = customerData.cep || '';
            document.getElementById('address').value = customerData.address || '';
            document.getElementById('number').value = customerData.number || '';
            document.getElementById('complement').value = customerData.complement || '';
            document.getElementById('city').value = customerData.city || '';
            document.getElementById('phone').value = customerData.phone || '';
        }
    }
    loadCustomerData();

    // Salvar dados do cliente no localStorage
    function saveCustomerData() {
        const customerData = {
            fullName: document.getElementById('fullName').value,
            cep: document.getElementById('cep').value,
            address: document.getElementById('address').value,
            number: document.getElementById('number').value,
            complement: document.getElementById('complement').value,
            city: document.getElementById('city').value,
            phone: document.getElementById('phone').value,
        };
        localStorage.setItem('customerData', JSON.stringify(customerData));
    }

    // Adiciona máscara de telefone ao input
    document.getElementById('phone').addEventListener('input', function (e) {
        let phone = e.target.value;
        phone = phone.replace(/\D/g, '');
        phone = phone.replace(/^(\d{2})(\d)/, '($1) $2');
        phone = phone.replace(/(\d{5})(\d)/, '$1-$2');
        e.target.value = phone;
    });

    // Funções de controle de quantidade e remoção do carrinho
    window.removeItem = function (index) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        renderOrderSummary();
    };

    window.increaseQuantity = function (index) {
        cart[index].quantity++;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderOrderSummary();
    };

    window.decreaseQuantity = function (index) {
        if (cart[index].quantity > 1) {
            cart[index].quantity--;
            localStorage.setItem('cart', JSON.stringify(cart));
            renderOrderSummary();
        }
    };

    // Função para atualizar a taxa de entrega
    function updateDeliveryFee(city) {
        if (city.toLowerCase() === 'brusque' || city.toLowerCase() === 'guabiruba') {
            deliveryFeeMessage.textContent = 'Investimento de entrega: R$ 7,00.';
        } else {
            deliveryFeeMessage.textContent = 'Para outras regiões, consulte o valor da taxa de entrega via WhatsApp.';
        }
    }
    document.getElementById('city').addEventListener('input', function () {
        updateDeliveryFee(this.value);
    });

    // Envio do pedido para o Telegram ao submeter o formulário
    document.getElementById('checkoutForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        saveCustomerData();

        const fullName = document.getElementById('fullName').value;
        const cep = document.getElementById('cep').value;
        const address = document.getElementById('address').value;
        const number = document.getElementById('number').value;
        const complement = document.getElementById('complement').value;
        const city = document.getElementById('city').value;
        const deliveryDate = document.getElementById('deliveryDate').value;
        const phone = document.getElementById('phone').value;
        const payment = document.getElementById('payment').value;

        // Formatar a data de entrega para o padrão BR
        const formattedDeliveryDate = deliveryDate.split('-').reverse().join('/');
        const total = parseFloat(orderTotal.textContent);
        if (total <= 0) {
            alert("Seu pedido está vazio, adicione um produto para finalizar a compra.");
            return;
        }

        const orderSummary = cart.map(item => `${item.quantity} x ${item.name} - R$ ${(item.quantity * item.price).toFixed(2)}`).join('\n');
        const deliveryFee = city.toLowerCase() === 'brusque' || city.toLowerCase() === 'guabiruba' ? 7 : 'Consultar via WhatsApp';
        const finalTotal = typeof deliveryFee === 'number' ? total + deliveryFee : total;
        const deliveryFeeText = typeof deliveryFee === 'number' ? `Investimento de entrega: R$ ${deliveryFee.toFixed(2)}` : deliveryFee;

        const fullOrderSummary = `*Novo pedido!*\n*Nome:* ${fullName}\n*CEP:* ${cep}\n*Data de entrega:* ${formattedDeliveryDate}\n*Endereço:* ${address}, Número: ${number}\n*Complemento:* ${complement}\n*Cidade:* ${city}\n*Telefone:* [${phone}](https://wa.me/${phone.replace(/[^0-9]/g, '')})\n\n*Pedido:*\n${orderSummary}\n\n*Forma de Pagamento:* ${payment}\n${deliveryFeeText}\n*Total Final:* R$ ${finalTotal.toFixed(2)}`;

        const telegramBotToken = '7771133074:AAHRznRkXHjBBdpfh6nrQbLymu6WwdzqrKg';
        const telegramChatId = '-1002415622182';
        const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

        try {
            const telegramResponse = await fetch(telegramUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: telegramChatId,
                    text: fullOrderSummary,
                    parse_mode: 'Markdown'
                })
            });

            if (telegramResponse.ok) {
                console.log("Pedido enviado com sucesso!");
            } else {
                console.error('Erro ao enviar pedido para o Telegram:', await telegramResponse.json());
            }
        } catch (error) {
            console.error('Erro ao enviar pedido para o Telegram:', error);
        }

        // Limpa o carrinho, atualiza o resumo e redireciona para a página de sucesso
        localStorage.removeItem('cart');
        renderOrderSummary();
        redirectToSuccessPage();
    });

    // Buscar endereço pelo CEP
    document.getElementById('cep').addEventListener('blur', function () {
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