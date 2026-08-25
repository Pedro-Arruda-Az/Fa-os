/* ============================================================
   FAÇOS - theme.js
   Aplica o modo claro/escuro salvo em todas as telas do
   painel profissional, pra ficar consistente ao navegar.
   ============================================================ */
(function () {
    if (localStorage.getItem('painelModoClaro') === 'true') {
        document.documentElement.classList.add('light-mode');
    }
})();
