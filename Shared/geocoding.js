// ============================================================
// FAÇOS - geocodificação de endereço (texto -> latitude/longitude)
//
// Usa o Nominatim (geocodificador gratuito do OpenStreetMap, o mesmo
// projeto que já fornece os ladrilhos do mapa em Localizacao/Mapa.js e
// Profissional/mapa.js) pra transformar o endereço em texto que a
// empresa/profissional digita no cadastro (ou depois no "meu perfil")
// numa coordenada real, sem precisar de chave de API.
//
// É "melhor esforço": se o endereço for vago, o serviço estiver fora do
// ar, ou não achar nada, devolve null — quem chamar essa função deve
// seguir em frente sem travar o cadastro/edição por causa disso (a
// pessoa não pode ficar impedida de criar a conta só porque o endereço
// não foi encontrado).
// ============================================================

async function geocodificarEndereco(endereco) {
    const texto = (endereco || '').trim();
    if (!texto) return null;

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&addressdetails=0&q=${encodeURIComponent(texto)}`;
        const resposta = await fetch(url, {
            headers: { 'Accept-Language': 'pt-BR' }
        });

        if (!resposta.ok) return null;

        const resultados = await resposta.json();
        if (!Array.isArray(resultados) || !resultados.length) return null;

        const latitude = Number(resultados[0].lat);
        const longitude = Number(resultados[0].lon);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

        return { latitude, longitude };
    } catch (err) {
        console.error('Não foi possível geocodificar o endereço:', err);
        return null;
    }
}
