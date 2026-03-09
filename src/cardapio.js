// src/cardapio.js

const produtos = {
    1: {
        nome: "📂 Papelaria",
        itens: [
            { nome: "Banner", preco: "A partir de R$ 80,00", desc: "Tamanhos: 60x90, 80x120, 100x150..." },
            { nome: "Foto Polaroid", preco: "R$ 2,50", desc: "Tamanhos: 6x7, 8x9" },
            { nome: "Azulejo Personalizado", preco: "R$ 30,00", desc: "Tamanhos: 20x20, 21x30" },
            { nome: "Azulejo 21x30", preco: "R$ 35,00", desc: "Grande" },
            { nome: "Cartão de Visita", preco: "R$ 150,00", desc: "1000 unidades" },
            { nome: "Wind banner", preco: "R$ 290,00", desc: "" },
            { nome: "Mini Calendário", preco: "R$ 3,50", desc: "" },
            { nome: "Etiqueta Escolar", preco: "R$ 29,90", desc: "35/40 unid + 2 chaveiros" }
        ]
    },
    2: {
        nome: "🎁 Personalizados",
        itens: [
            { nome: "Caneca Personalizada", preco: "R$ 39,90", desc: "" },
            { nome: "Álbum de Fotos + 18 Fotos", preco: "R$ 89,00", desc: "30 folhas" },
            { nome: "Caneca de Chopp", preco: "R$ 4,50 un", desc: "" },
            { nome: "Chaveiro", preco: "R$ 4,00", desc: "" },
            { nome: "Caixinha Personalizada", preco: "R$ 25,00", desc: "" },
            { nome: "Caixa Cone Pirâmide", preco: "R$ 4,00", desc: "" },
            { nome: "Topo de Bolo", preco: "R$ 15,00", desc: "" },
            { nome: "Quadro Personalizado", preco: "R$ 29,90", desc: "" }
        ]
    },
    3: {
        nome: "🎉 Eventos",
        itens: [
            { nome: "Banner de 15 Anos", preco: "R$ 150,00", desc: "" },
            { nome: "Buquê de Borboleta c/ LED", preco: "R$ 80,00", desc: "Estoque baixo!" },
            { nome: "Buquê de Borboleta s/ LED", preco: "R$ 70,00", desc: "" }
        ]
    }
};

module.exports = produtos;