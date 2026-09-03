
const FACOS_NOTIF_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const FACOS_NOTIF_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

function facosNotifIdentidade() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    const profissionalLogado = localStorage.getItem('profissionalLogado');

    if (usuarioLogado) {
        try {
            return { email: JSON.parse(usuarioLogado).email, tipo: 'cliente' };
        } catch (e) { return null; }
    }
    if (profissionalLogado) {
        try {
            return { email: JSON.parse(profissionalLogado).email, tipo: 'profissional' };
        } catch (e) { return null; }
    }
    return null;
}

async function facosAtualizarBadgeNotificacoes(client, identidade) {
    const badges = document.querySelectorAll('[data-notif-badge]');
    if (badges.length === 0) return;

    const { count, error } = await client
        .from('notificacoes_app')
        .select('id', { count: 'exact', head: true })
        .eq('destinatario_email', identidade.email)
        .eq('destinatario_tipo', identidade.tipo)
        .eq('lida', false);

    if (error) {
        console.error('Erro ao buscar notificações não lidas:', error);
        return;
    }

    badges.forEach((badge) => {
        if (count && count > 0) {
            badge.textContent = count > 9 ? '9+' : String(count);
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.supabase) return;

    const identidade = facosNotifIdentidade();
    if (!identidade) return;

    const client = window.supabase.createClient(FACOS_NOTIF_URL, FACOS_NOTIF_KEY);

    facosAtualizarBadgeNotificacoes(client, identidade);

    client
        .channel(`notif-badge-${identidade.tipo}-${identidade.email}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'notificacoes_app',
            filter: `destinatario_email=eq.${identidade.email}`
        }, () => facosAtualizarBadgeNotificacoes(client, identidade))
        .subscribe();
});
