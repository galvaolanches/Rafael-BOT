// src/bot.js
require('dotenv').config(); 
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { stages, storage } = require('./stages');
const fs = require('fs');
const path = require('path');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'bot-v2' }), 
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('\n>>> ESCANEIE O QR CODE ACIMA <<<\n');
});

client.on('ready', () => {
    console.log('✅ O Bot está pronto e atendendo 24H!');
});

function salvarPedidoNoBanco(usuario, nomeCliente, itens) {
    const arquivo = path.join(__dirname, '../data/pedidos.json');
    const novoPedido = {
        id: Date.now(),
        data: new Date().toLocaleString(),
        cliente_nome: nomeCliente, 
        cliente_numero: usuario.replace('@c.us', ''), 
        pedido: itens,
        status: 'Pendente'
    };

    try {
        let dadosAtuais = [];
        if (fs.existsSync(arquivo)) {
            const conteudo = fs.readFileSync(arquivo, 'utf8');
            dadosAtuais = JSON.parse(conteudo || '[]');
        }
        dadosAtuais.push(novoPedido);
        fs.writeFileSync(arquivo, JSON.stringify(dadosAtuais, null, 2));
    } catch (erro) {
        console.error('Erro ao salvar pedido:', erro);
    }
}

client.on('message', async msg => {
    if (msg.from.includes('@g.us') || msg.from.includes('status')) return;

    const user = msg.from;
    const texto = msg.body;

    if (!storage[user]) {
        storage[user] = { stage: 0, itens: [] };
    }

    // Atalho para voltar ao menu
    if ((texto === '0' || texto.toLowerCase() === 'menu') && storage[user].stage !== 3) {
        storage[user].stage = 0;
    }

    try {
        const estagioAnterior = storage[user].stage;
        const response = stages[estagioAnterior].obj(user, texto);
        const novoEstagio = storage[user].stage;

        // Se finalizou o pedido (foi do estágio 3 para o 4)
        if (estagioAnterior === 3 && novoEstagio === 4) {
            const contact = await msg.getContact();
            const nomeReal = contact.name || contact.pushname || user.replace('@c.us', '');
            salvarPedidoNoBanco(user, nomeReal, storage[user].itens);

            const numeroDono = process.env.NUMERO_DONO;
            if (numeroDono) {
                const alerta = `🚨 *NOVO PEDIDO!* 🚨\n👤 Cliente: *${nomeReal}*\n🛒: ${storage[user].itens}`;
                client.sendMessage(numeroDono, alerta);
            }
        }

        if (response) {
            const chat = await msg.getChat();
            if (typeof response === 'object' && response.tipo === 'imagem') {
                chat.sendStateTyping();
                await client.sendMessage(user, response.media, { caption: response.caption });
                setTimeout(() => { client.sendMessage(user, response.texto); }, 1000);
            } else {
                chat.sendStateTyping();
                setTimeout(() => { client.sendMessage(user, response); }, 1000); 
            }
        }
    } catch (e) {
        console.error("Erro ao processar mensagem:", e);
    }
});

client.initialize().catch(err => {
    console.error("Erro ao iniciar: Verifique o Gerenciador de Tarefas!");
});

module.exports = client;