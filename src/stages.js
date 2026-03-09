// src/stages.js
const cardapio = require('./cardapio');
const { MessageMedia } = require('whatsapp-web.js');

const storage = {}; 

const CHAVE_PIX = "5555999712009"; 
const NOME_BENEFICIARIO = "Kethlyn Raquel";

const stages = {
    // Estágio 0: Menu Principal
    0: {
        descricao: "Boas Vindas",
        obj: (user, message) => {
            storage[user].stage = 1;

            return `Olá 👋 Bem-vindo à *Ketty Personalizados*! ✨

Como posso te ajudar hoje?

1️⃣ *VER CATÁLOGO DE PRODUTOS*
2️⃣ *FAZER UM PEDIDO DIRETO*
3️⃣ *FALAR COM ATENDENTE*

_Digite o número da opção desejada:_`;
        }
    },

    // Estágio 1: Seleção
    1: {
        descricao: "Seleção Menu",
        obj: (user, message) => {
            if (message === '1') {
                storage[user].stage = 2; 
                return `📂 *Nossas Categorias:*

1️⃣ Papelaria (Banners, Fotos, Cartões)
2️⃣ Personalizados (Canecas, Quadros, Lembrancinhas)
3️⃣ Eventos (Buquês, Kits Festa)

*Digite o número da categoria que deseja ver:*`;
            } 
            else if (message === '2') {
                storage[user].stage = 3; 
                return "📝 Ótimo! Digite abaixo o *NOME DO PRODUTO* e a *QUANTIDADE* que você deseja:";
            } 
            else if (message === '3') {
                storage[user].stage = 4; 
                return "👤 Um de nossos atendentes irá te responder em breve. Pode deixar sua dúvida aqui:";
            }
            return "❌ Opção inválida. Digite 1, 2 ou 3.";
        }
    },

    // Estágio 2: Exibir Produtos
    2: {
        descricao: "Exibir Produtos",
        obj: (user, message) => {
            if (message === '0') {
                storage[user].stage = 0;
                return "Voltando ao menu principal...";
            }

            const categoriaId = parseInt(message);
            if (cardapio[categoriaId]) {
                const categoria = cardapio[categoriaId];
                
                let respostaTexto = `*${categoria.nome}*\n------------------------------\n`;
                categoria.itens.forEach(item => {
                    respostaTexto += `▪️ *${item.nome}*\n   💰 ${item.preco}\n`;
                    if(item.desc) respostaTexto += `   ℹ️ _${item.desc}_\n`;
                    respostaTexto += `\n`;
                });
                respostaTexto += `------------------------------\n\n Gostou de algo? Digite o *NOME DO PRODUTO* para fazer o pedido (ou digite 0 para voltar).`;

                storage[user].stage = 3; 

                let caminhoImagem = './assets/padrao.jpg';
                if (categoriaId === 1) caminhoImagem = './assets/papelaria.jpg';
                if (categoriaId === 2) caminhoImagem = './assets/personalizados.jpg';
                if (categoriaId === 3) caminhoImagem = './assets/eventos.jpg';

                try {
                    const media = MessageMedia.fromFilePath(caminhoImagem);
                    return {
                        tipo: 'imagem',
                        media: media,
                        caption: `*${categoria.nome}* 👇`,
                        texto: respostaTexto
                    };
                } catch (e) {
                    return respostaTexto;
                }
            }
            return "❌ Categoria inválida. Digite 1, 2 ou 3.";
        }
    },

    // Estágio 3: Confirmar Pedido
    3: {
        descricao: "Coleta de Pedido",
        obj: (user, message) => {
            if (message === '0') {
                storage[user].stage = 0;
                return "Voltando...";
            }

            storage[user].itens = message;
            storage[user].stage = 4; 

            return `✅ *Pedido Iniciado!*

Você escolheu: *${message}*

-----------------------------------------
💰 *POLÍTICA DE PAGAMENTO*
Trabalhamos com sinal de **50%** para início da produção.
A outra metade (50%) na entrega! 📦

🔑 *CHAVE PIX:* *${CHAVE_PIX}*
👤 *NOME:* ${NOME_BENEFICIARIO}
-----------------------------------------

*Para finalizar, envie agora:*
1. 📸 O *Comprovante* do sinal (50%)
2. 🖼️ A *Foto/Arte* (se for personalizado)
3. ✍️ Seu *Nome Completo*`;
        }
    },

    // Estágio 4: Atendimento Humano
    4: {
        descricao: "Humano",
        obj: (user, message) => {
            if(message.toLowerCase().includes('#menu') || message.toLowerCase() === 'encerrar') {
                storage[user].stage = 0;
                return "🤖 Bot reativado. Voltando ao menu...";
            }
            return null; 
        }
    }
};

module.exports = { stages, storage };