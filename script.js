console.log('Faços - script.js carregado');

document.addEventListener('DOMContentLoaded', () => {
    // ========== SCROLL SUAVE PROS ANCHORS DO MENU ==========
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').slice(1);
            const target = document.getElementById(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});
