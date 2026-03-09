require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const client = require('./bot');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { MessageMedia } = require('whatsapp-web.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(bodyParser.json());

const ARQUIVO_PEDIDOS = path.join(__dirname, '../data/pedidos.json');

const DADOS_LOJA = {
    endereco: "Rua Siao, 225 - CASA B, Bairro Santa Carmem",
    instagram: "@_ketyrf7",
    whatsapp_contato: "(55) 99971-2009",
    site: "kethlyn-raquel.github.io"
};

const limparTexto = (txt) => {
    if (!txt) return "";
    return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "").trim();    
};

// --- ROTAS DE GESTÃO E DASHBOARD ---

app.get('/api/dashboard', (req, res) => {
    try {
        const pedidos = JSON.parse(fs.readFileSync(ARQUIVO_PEDIDOS, 'utf8') || '[]');
        const total = pedidos.length;
        const producao = pedidos.filter(p => p.status === 'Em Produção').length;
        let faturamento = 0;
        pedidos.forEach(p => {
            const match = p.pedido.match(/R\$\s?(\d+[,.]?\d*)/);
            if (match) faturamento += parseFloat(match[1].replace(',', '.'));
        });
        res.json({ total, producao, faturamento });
    } catch (e) { res.json({ total: 0, producao: 0, faturamento: 0 }); }
});

app.post('/api/enviar-pix-sinal', async (req, res) => {
    const { id, valorTotal } = req.body;
    const CHAVE_PIX = "5555999712009"; 

    try {
        let pedidos = JSON.parse(fs.readFileSync(ARQUIVO_PEDIDOS, 'utf8'));
        const pedido = pedidos.find(p => p.id == id);

        if (pedido) {
            const totalNum = parseFloat(valorTotal.replace(',', '.'));
            const adiantamento = (totalNum / 2).toFixed(2).replace('.', ',');
            const clienteId = pedido.cliente_numero.includes('@') ? pedido.cliente_numero : `${pedido.cliente_numero}@c.us`;

            // MUDANÇA DE TEXTO AQUI:
            const mensagem = `🌟 *Olá, ${pedido.cliente_nome}!* \n\nPara confirmarmos seu pedido e darmos início à produção dos seus personalizados, trabalhamos com um *adiantamento de 50% do valor total*.\n\n💰 *Valor do Adiantamento:* R$ ${adiantamento}\n🔑 *Chave Pix:* ${CHAVE_PIX}\n\nO restante do pagamento é feito no momento da entrega do seu produto! 😊\n\n*Por gentileza, envie o comprovante por aqui assim que realizar a transferência.*`;

            await client.sendMessage(clienteId, mensagem);
            res.json({ success: true });
        } else { res.status(404).json({ error: "Pedido não encontrado" }); }
    } catch (error) { res.status(500).json({ error: "Erro ao enviar Pix" }); }
});

app.delete('/api/pedidos/:id', (req, res) => {
    try {
        let pedidos = JSON.parse(fs.readFileSync(ARQUIVO_PEDIDOS, 'utf8'));
        pedidos = pedidos.filter(p => p.id != req.params.id);
        fs.writeFileSync(ARQUIVO_PEDIDOS, JSON.stringify(pedidos, null, 2));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Erro ao deletar" }); }
});

app.delete('/api/limpar-todos', (req, res) => {
    try {
        fs.writeFileSync(ARQUIVO_PEDIDOS, JSON.stringify([], null, 2));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Erro ao limpar" }); }
});

app.get('/api/pedidos', (req, res) => {
    try {
        if (fs.existsSync(ARQUIVO_PEDIDOS)) {
            const conteudo = fs.readFileSync(ARQUIVO_PEDIDOS, 'utf8');
            res.json(JSON.parse(conteudo || '[]').reverse());
        } else { res.json([]); }
    } catch (error) { res.json([]); }
});

app.post('/api/status', async (req, res) => {
    const { id, novoStatus } = req.body;
    try {
        let pedidos = JSON.parse(fs.readFileSync(ARQUIVO_PEDIDOS, 'utf8'));
        const index = pedidos.findIndex(p => p.id == id);
        if (index !== -1) {
            const pedido = pedidos[index];
            pedido.status = novoStatus;
            fs.writeFileSync(ARQUIVO_PEDIDOS, JSON.stringify(pedidos, null, 2));
            const clienteId = pedido.cliente_numero.includes('@') ? pedido.cliente_numero : `${pedido.cliente_numero}@c.us`;

            if (novoStatus === 'Em Produção') await client.sendMessage(clienteId, `🎨 *Boa noticia!* Seu pedido ja entrou em producao.`);
            else if (novoStatus === 'Pronto') await client.sendMessage(clienteId, `✅ *Seu pedido esta pronto!* 🎉\nEstou enviando o seu recibo oficial abaixo.`);

            if (novoStatus === 'Pronto') {
                const pdfPath = path.resolve(__dirname, `../data/Recibo_${id}.pdf`);
                const criarPDF = () => {
                    return new Promise((resolve, reject) => {
                        const doc = new PDFDocument({ margin: 50 });
                        const stream = fs.createWriteStream(pdfPath);
                        doc.pipe(stream);
                        const logoPath = path.resolve(__dirname, '../assets/logo.png');
                        if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 45, { width: 80 });
                        doc.font('Helvetica-Bold').fontSize(20).fillColor('#075e54').text('RECIBO DE PEDIDO', { align: 'right' });
                        doc.moveDown(0.5);
                        doc.font('Helvetica').fontSize(10).fillColor('#000').text(`Pedido ID: ${pedido.id}`, { align: 'right' });
                        doc.text(`Data: ${pedido.data}`, { align: 'right' });
                        doc.moveDown(2);
                        let nomeDisplay = limparTexto(pedido.cliente_nome) || "Cliente Especial";
                        doc.font('Helvetica-Bold').fontSize(14).text('DADOS DO CLIENTE', { underline: true });
                        doc.moveDown(0.5);
                        doc.font('Helvetica').fontSize(12).text(`Nome: ${nomeDisplay}`);
                        doc.text(`WhatsApp: ${pedido.cliente_numero.split('@')[0]}`);
                        doc.moveDown(1.5);
                        doc.font('Helvetica-Bold').fontSize(14).text('ITENS DO PEDIDO', { underline: true });
                        doc.moveDown(0.5);
                        doc.font('Helvetica').fontSize(12).text(limparTexto(pedido.pedido) || "Personalizados");
                        doc.moveDown(4);
                        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#eeeeee').lineWidth(1).stroke();
                        doc.moveDown(1);
                        doc.font('Helvetica-Bold').fontSize(10).fillColor('#075e54').text('CONTATO E LOCALIZACAO', { align: 'center' });
                        doc.font('Helvetica').fontSize(9).fillColor('#444');
                        doc.text(`Endereco: ${DADOS_LOJA.endereco}`, { align: 'center' });
                        doc.text(`Instagram: ${DADOS_LOJA.instagram} | WhatsApp: ${DADOS_LOJA.whatsapp_contato}`, { align: 'center' });
                        doc.end();
                        stream.on('finish', resolve);
                        stream.on('error', reject);
                    });
                };
                await criarPDF();
                await new Promise(r => setTimeout(r, 2000));
                if (fs.existsSync(pdfPath)) {
                    const media = MessageMedia.fromFilePath(pdfPath);
                    await client.sendMessage(clienteId, media, { caption: 'Aqui esta seu recibo oficial. 📄' });
                }
            }
            res.json({ success: true });
        }
    } catch (error) { res.status(500).json({ error: "Erro interno" }); }
});

app.listen(PORT, () => console.log(`🖥️ Painel: http://localhost:${PORT}`));
client.initialize();