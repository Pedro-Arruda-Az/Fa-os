// ============================================================
// FAÇOS - foto de perfil (empresa e profissional)
//
// Duas coisas usadas em várias telas:
//
// 1) redimensionarFoto(file) - antes de gravar a foto escolhida no
//    banco, redimensiona ela pra um quadrado pequeno (thumbnail) e
//    comprime em JPEG. Sem isso, cada foto em tamanho original
//    (várias vezes maior) deixaria as listagens de profissionais
//    pesadas, porque a foto vai junto de cada linha da tabela.
//
// 2) avatarConteudo(foto, iniciais) - o HTML de dentro de uma
//    "bolinha" de avatar: a foto, se tiver, ou as iniciais, como já
//    era antes. Usado em todo canto que hoje só mostra iniciais
//    (cards de profissional, modal de detalhes, conversas do chat,
//    tela do próprio perfil).
// ============================================================

function redimensionarFoto(file, tamanho = 240, qualidade = 0.78) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = tamanho;
                canvas.height = tamanho;
                const ctx = canvas.getContext('2d');

                // corta o quadrado central (cover-crop) e desenha já no
                // tamanho final, pra não gravar mais pixels do que precisa
                const lado = Math.min(img.width, img.height);
                const sx = (img.width - lado) / 2;
                const sy = (img.height - lado) / 2;
                ctx.drawImage(img, sx, sy, lado, lado, 0, 0, tamanho, tamanho);

                resolve(canvas.toDataURL('image/jpeg', qualidade));
            };
            img.onerror = () => reject(new Error('Não foi possível ler essa imagem.'));
            img.src = e.target.result;
        };
        leitor.onerror = () => reject(new Error('Não foi possível ler esse arquivo.'));
        leitor.readAsDataURL(file);
    });
}

function avatarConteudo(foto, iniciais) {
    if (foto) {
        return `<img src="${foto}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    }
    return iniciais || '?';
}

window.redimensionarFoto = redimensionarFoto;
window.avatarConteudo = avatarConteudo;
