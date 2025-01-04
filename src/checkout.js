document.addEventListener('DOMContentLoaded', function() {
    let total = 0;
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const orderItems = document.getElementById('orderItems');
    const orderTotal = document.getElementById('orderTotal');
    const deliveryFeeMessage = document.getElementById('deliveryFeeMessage');

    // Função para renderizar o resumo do pedido
    function renderOrderSummary() {
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
        // Adiciona máscara de telefone ao input de telefone
        document.getElementById('phone').addEventListener('input', function (e) {
            let phone = e.target.value;
    
            phone = phone.replace(/\D/g, '');
    
            phone = phone.replace(/^(\d{2})(\d)/, '($1) $2'); // (XX) X...
            phone = phone.replace(/(\d{5})(\d)/, '$1-$2'); // (XX) XXXXX-XXXX
    
            e.target.value = phone;
        });
        // Adiciona máscara de cep ao input de cep

        document.getElementById('cep').addEventListener('input', function (e) {
            let cep = e.target.value;
        
            // Remove todos os caracteres que não são números
            cep = cep.replace(/\D/g, '');
        
            // Formata no padrão xxxxx-xxx
            cep = cep.replace(/^(\d{5})(\d)/, '$1-$2');
        
            // Atualiza o valor do input com o formato correto
            e.target.value = cep;
        });

    // Funções de controle de quantidade e remoção do carrinho
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

    // Função para atualizar a taxa de entrega
    function updateDeliveryFee(city) {
        if (city.toLowerCase() === 'brusque' || city.toLowerCase() === 'guabiruba') {
            deliveryFeeMessage.textContent = 'Investimento de entrega: R$ 7,00.';
        } else {
            deliveryFeeMessage.textContent = 'Para outras regiões, consulte o valor da taxa de entrega via WhatsApp.';
        }
    }

    // Atualiza a taxa de entrega com base na cidade digitada
    document.getElementById('city').addEventListener('input', function() {
        updateDeliveryFee(this.value);
    });

    // DESATIVADA TEMPORARIAMENTE!!!!!
    //  Função para renderizar os pedidos no dashboard 
    // async function renderPedidos() {
    //     try {
    //         const response = await fetch('/api/orders');
    //         const pedidos = await response.json();
    //         const pedidosList = document.getElementById('pedidosList');
    //         pedidosList.innerHTML = '';  // Limpa o conteúdo anterior
    
    //         pedidos.forEach(pedido => {
    //             // Verifica se "pedido.total" existe antes de usar o "toFixed()"
    //             const total = pedido.total ? pedido.total.toFixed(2) : '0.00';
    //             const listItem = document.createElement('li');
    //             listItem.textContent = `Pedido #${pedido.orderNumber} - Cliente: ${pedido.customerName} - Total: R$ ${total}`;
    //             pedidosList.appendChild(listItem);
    //         });
    //     } catch (error) {
    //         console.error('Erro ao buscar pedidos:', error);
    //     }
    // }


    //Redireciona para página com mensagem de sucesso
    function redirectToSuccessPage() {
        console.log("Valor de total:", total); // Debug: Verificar o valor de total
        // Redireciona o usuário para a página de sucesso
        if (total > 0) {
            window.location.href = "/pedido-sucesso.html"; // Altere para o caminho da sua página
        }else{
            alert("Seu pedido está vazio, adicione um produto para finalizar a compra.");
            return;
        }
    }
    
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
    
        const orderSummary = cart.map(item => `${item.quantity} x ${item.name} - R$ ${(item.quantity * item.price).toFixed(2)}`).join('\n');
        const deliveryFee = city.toLowerCase() === 'brusque' || city.toLowerCase() === 'guabiruba' ? 7 : 'Consultar via WhatsApp';
        const finalTotal = typeof deliveryFee === 'number' ? total + deliveryFee : total;
        const deliveryFeeText = typeof deliveryFee === 'number' ? `Investimento de entrega: R$ ${deliveryFee.toFixed(2)}` : deliveryFee;
    
        const fullOrderSummary = `*Novo pedido!*\n*Nome:* ${fullName}\n*CEP:* ${cep}\n*Endereço:* ${address}, Número: ${number}\n*Complemento:* ${complement}\n*Cidade:* ${city}\n*Telefone:* [${phone}](https://wa.me/${phone.replace(/[^0-9]/g, '')})\n\n*Pedido:*\n${orderSummary}\n\n*Forma de Pagamento:* ${payment}\n${deliveryFeeText}\n*Total Final:* R$ ${finalTotal.toFixed(2)}`;
    
        // Enviar pedido para o Telegram
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
    
        // Esvaziar o carrinho após confirmar o pedido
        localStorage.removeItem('cart');
        renderOrderSummary();
        redirectToSuccessPage();
    });
    // Buscar endereço pelo CEP
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


    // Renderizar o resumo do pedido
    renderOrderSummary();
    // renderPedidos();  // Renderizar os pedidos na inicialização da página
    console.log("Total fora: ", total)
});


