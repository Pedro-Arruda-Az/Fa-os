
const http = require('http');
const https = require('https');

const ACCESS_TOKEN = 'APP_USR-2991875109649887-061020-07b3ac464f9a25e0272cd8ba40bf2321-3466462896';
const PORT = 3001;

function criarPreferencia(proNome, callback) {
    const body = JSON.stringify({
        items: [
            {
                title: `Serviço de Limpeza Residencial - ${proNome}`,
                quantity: 1,
                currency_id: 'BRL',
                unit_price: 120.00
            }
        ],
        back_urls: {
            success: 'http://localhost:5500/Landing%20Page/TelaIni.html',
            failure: 'http://localhost:5500/index.html',
            pending: 'http://localhost:5500/Landing%20Page/TelaIni.html'
        },
        auto_return: 'approved',
        statement_descriptor: 'FACOS SERVICOS',
        external_reference: `FACO-${Date.now()}`
    });

    const options = {
        hostname: 'api.mercadopago.com',
        path: '/checkout/preferences',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Length': Buffer.byteLength(body)
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                callback(null, parsed);
            } catch (e) {
                callback(new Error('Erro ao parsear resposta do MP'));
            }
        });
    });

    req.on('error', (e) => callback(e));
    req.write(body);
    req.end();
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/criar-preferencia') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            let proNome = 'Profissional';
            try {
                const parsed = JSON.parse(body);
                if (parsed.proNome) proNome = parsed.proNome;
            } catch (_) {}

            criarPreferencia(proNome, (err, data) => {
                if (err || !data.init_point) {
                    console.error('Erro MP:', err || data);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Erro ao criar preferência' }));
                    return;
                }

                console.log(`✅ Preferência criada para: ${proNome} | URL: ${data.init_point}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ init_point: data.init_point }));
            });
        });
        return;
    }

    res.writeHead(404);
    res.end('Not found');
});

server.listen(PORT, () => {
    console.log(`\n🚀 Servidor Faços rodando em http://localhost:${PORT}`);
    console.log(`   Endpoint: POST http://localhost:${PORT}/criar-preferencia\n`);
});
