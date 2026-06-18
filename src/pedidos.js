/* =========================================================
   Painel de Pedidos — 100 Cinco Distribuidora
   Auth + Polling + Dashboard + Charts + Push + CSV + Print
   ========================================================= */

(() => {
    // ---------- Config ----------
    const API_BASE = (window.PEDIDOS_API_BASE || window.location.origin).replace(/\/$/, '');
    const TOKEN_KEY = 'pedidos100c_token';
    const SOUND_KEY = 'pedidos100c_sound';
    const NOTIFY_KEY = 'pedidos100c_notify';
    const PERIOD_KEY = 'pedidos100c_period';
    const POLL_INTERVAL_MS = 4000;
    const POLL_INTERVAL_HIDDEN_MS = 15000;
    const STATS_REFRESH_MS = 20000;

    // ---------- State ----------
    const state = {
        token: localStorage.getItem(TOKEN_KEY) || null,
        view: 'dashboard',
        orders: [],
        ordersIndex: new Map(),
        filter: 'all',
        search: '',
        soundOn: localStorage.getItem(SOUND_KEY) !== '0',
        notifyOn: localStorage.getItem(NOTIFY_KEY) === '1',
        period: { preset: localStorage.getItem(PERIOD_KEY) || 'today', from: null, to: null },
        stats: null,
        pollTimer: null,
        statsTimer: null,
        polling: false,
        firstLoadDone: false,
        charts: { series: null, status: null },
        pwaInstallPrompt: null,
        pushSubscribed: false,
        customers: [],
        customerSearch: '',
        customerSort: 'lastOrderAt',
        customerStats: null,
    };

    const STATUS_FLOW = {
        novo: { label: 'Novo', next: 'em_preparo', nextLabel: 'Iniciar Preparo', nextBtn: 'btn-mango' },
        em_preparo: { label: 'Em Preparo', next: 'saiu_para_entrega', nextLabel: 'Saiu p/ Entrega', nextBtn: 'btn-sky' },
        saiu_para_entrega: { label: 'Saiu p/ Entrega', next: 'entregue', nextLabel: 'Confirmar Entrega', nextBtn: 'btn-primary' },
        entregue: { label: 'Entregue', next: null },
        cancelado: { label: 'Cancelado', next: null },
    };
    const STATUS_LABEL = {
        novo: 'Novo', em_preparo: 'Em Preparo', saiu_para_entrega: 'Saiu p/ Entrega',
        entregue: 'Entregue', cancelado: 'Cancelado',
    };
    const STATUS_COLOR = {
        novo: '#10B981', em_preparo: '#F59E0B', saiu_para_entrega: '#0EA5E9',
        entregue: '#4C1D95', cancelado: '#E11D48',
    };

    // ---------- DOM Helpers ----------
    const $ = (id) => document.getElementById(id);
    const fmtBRL = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const fmtNum = (v) => (Number(v) || 0).toLocaleString('pt-BR');

    const fmtTime = (date) => {
        const d = new Date(date);
        const diffMin = Math.floor((new Date() - d) / 60000);
        if (diffMin < 1) return 'agora mesmo';
        if (diffMin < 60) return `há ${diffMin} min`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `há ${diffH}h`;
        return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };
    const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR');
    const fmtDateTimeBR = (d) => new Date(d).toLocaleString('pt-BR');

    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
    function onlyDigits(s) { return String(s ?? '').replace(/\D/g, ''); }

    function showToast(message, type = 'info') {
        const div = document.createElement('div');
        const icons = {
            success: ['check-circle', 'text-brand-green', 'border-brand-green'],
            error: ['alert-circle', 'text-brand-berry', 'border-brand-berry'],
            info: ['info', 'text-brand-sky', 'border-brand-sky'],
        };
        const [icon, color, border] = icons[type] || icons.info;
        div.className = `bg-white text-brand-dark px-4 py-3 rounded-xl shadow-soft flex items-start gap-3 transform transition-all duration-300 translate-x-full opacity-0 pointer-events-auto border-l-4 ${border}`;
        div.innerHTML = `
            <i data-lucide="${icon}" class="w-5 h-5 ${color} flex-shrink-0 mt-0.5"></i>
            <span class="text-sm font-medium leading-snug pr-2">${escapeHtml(message)}</span>
        `;
        $('toastContainer').appendChild(div);
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => div.classList.remove('translate-x-full', 'opacity-0'));
        setTimeout(() => {
            div.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => div.remove(), 300);
        }, 4000);
    }

    // ---------- API ----------
    async function api(path, opts = {}) {
        const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
        if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
        const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
        if (res.status === 401) {
            logout();
            throw new Error('Sessão expirada');
        }
        let data = null;
        try { data = await res.json(); } catch {}
        if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`);
        return data;
    }

    // ---------- Sound ----------
    let audioCtx = null;
    function playDing() {
        if (!state.soundOn) return;
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const now = audioCtx.currentTime;
            [880, 1318].forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.18);
                gain.gain.setValueAtTime(0, now + i * 0.18);
                gain.gain.linearRampToValueAtTime(0.25, now + i * 0.18 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.5);
                osc.connect(gain).connect(audioCtx.destination);
                osc.start(now + i * 0.18);
                osc.stop(now + i * 0.18 + 0.55);
            });
        } catch (e) { console.warn('Audio falhou:', e); }
    }

    // ---------- Service Worker + Push ----------
    let swRegistration = null;

    async function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return null;
        try {
            const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            swRegistration = reg;
            return reg;
        } catch (e) {
            console.warn('SW register falhou:', e);
            return null;
        }
    }

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const raw = atob(base64);
        const arr = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        return arr;
    }

    async function getPushSubscription() {
        if (!swRegistration) return null;
        return swRegistration.pushManager.getSubscription();
    }

    async function subscribePush() {
        if (!('PushManager' in window) || !swRegistration) {
            showToast('Seu navegador não suporta push notifications.', 'error');
            return false;
        }
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
            showToast('Permissão de notificação negada.', 'error');
            return false;
        }
        try {
            const { publicKey } = await api('/api/push/public-key');
            const sub = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });
            const subJson = sub.toJSON();
            await api('/api/push/subscribe', {
                method: 'POST',
                body: JSON.stringify({
                    endpoint: subJson.endpoint,
                    keys: subJson.keys,
                    userAgent: navigator.userAgent.slice(0, 200),
                }),
            });
            state.pushSubscribed = true;
            state.notifyOn = true;
            localStorage.setItem(NOTIFY_KEY, '1');
            updateBellIcon();
            $('pushBanner').classList.add('hidden-soft');
            showToast('Notificações ativadas! Você vai receber pedidos no celular.', 'success');
            return true;
        } catch (e) {
            console.error(e);
            showToast(`Erro ao ativar: ${e.message}`, 'error');
            return false;
        }
    }

    async function unsubscribePush() {
        const sub = await getPushSubscription();
        if (sub) {
            await api('/api/push/unsubscribe', {
                method: 'POST',
                body: JSON.stringify({ endpoint: sub.endpoint }),
            }).catch(() => {});
            await sub.unsubscribe();
        }
        state.pushSubscribed = false;
        state.notifyOn = false;
        localStorage.setItem(NOTIFY_KEY, '0');
        updateBellIcon();
        showToast('Notificações desativadas.', 'info');
    }

    function updateBellIcon() {
        const icon = state.notifyOn ? 'bell-ring' : 'bell';
        $('bellIcon').setAttribute('data-lucide', icon);
        if (window.lucide) lucide.createIcons();
    }

    async function checkPushBanner() {
        if (!('Notification' in window) || !('PushManager' in window)) return;
        const sub = await getPushSubscription();
        state.pushSubscribed = !!sub && Notification.permission === 'granted';
        if (state.pushSubscribed) {
            state.notifyOn = true;
            localStorage.setItem(NOTIFY_KEY, '1');
            updateBellIcon();
            $('pushBanner').classList.add('hidden-soft');
        } else if (Notification.permission !== 'denied') {
            $('pushBanner').classList.remove('hidden-soft');
        }
    }

    // ---------- PWA install prompt ----------
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        state.pwaInstallPrompt = e;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (!isStandalone) $('installBanner').classList.remove('hidden-soft');
    });
    window.addEventListener('appinstalled', () => {
        $('installBanner').classList.add('hidden-soft');
        showToast('App instalado!', 'success');
    });

    // ---------- Auth ----------
    function showLogin() {
        $('loginScreen').classList.remove('hidden-soft');
        $('dashboard').classList.add('hidden-soft');
        setTimeout(() => $('loginUser').focus(), 50);
    }
    function showDashboard() {
        $('loginScreen').classList.add('hidden-soft');
        $('dashboard').classList.remove('hidden-soft');
    }
    async function login(username, password) {
        const data = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        state.token = data.token;
        localStorage.setItem(TOKEN_KEY, data.token);
        return data.user;
    }
    function logout() {
        stopPolling();
        clearInterval(state.statsTimer);
        state.token = null;
        localStorage.removeItem(TOKEN_KEY);
        state.orders = [];
        state.ordersIndex.clear();
        state.firstLoadDone = false;
        Object.values(state.charts).forEach((c) => c?.destroy());
        state.charts = { series: null, status: null };
        showLogin();
    }
    async function checkAuth() {
        if (!state.token) return false;
        try { await api('/api/auth/me'); return true; } catch { return false; }
    }

    // ---------- Period ----------
    function computePeriodRange(preset) {
        const now = new Date();
        const start = new Date(now); start.setHours(0, 0, 0, 0);
        const end = new Date(now); end.setHours(23, 59, 59, 999);
        switch (preset) {
            case 'today': return { from: start, to: end, label: 'Hoje' };
            case 'yesterday': {
                const s = new Date(start); s.setDate(s.getDate() - 1);
                const e = new Date(end); e.setDate(e.getDate() - 1);
                return { from: s, to: e, label: 'Ontem' };
            }
            case '7d': {
                const s = new Date(start); s.setDate(s.getDate() - 6);
                return { from: s, to: end, label: 'Últimos 7 dias' };
            }
            case '30d': {
                const s = new Date(start); s.setDate(s.getDate() - 29);
                return { from: s, to: end, label: 'Últimos 30 dias' };
            }
            case 'month': {
                const s = new Date(now.getFullYear(), now.getMonth(), 1);
                return { from: s, to: end, label: 'Este mês' };
            }
            default: return { from: start, to: end, label: 'Hoje' };
        }
    }

    function setPeriod(preset, customFrom = null, customTo = null) {
        state.period.preset = preset;
        if (preset === 'custom' && customFrom && customTo) {
            const f = new Date(customFrom); f.setHours(0, 0, 0, 0);
            const t = new Date(customTo); t.setHours(23, 59, 59, 999);
            state.period.from = f;
            state.period.to = t;
            $('periodLabel').textContent = `${fmtDate(f)} → ${fmtDate(t)}`;
        } else {
            const r = computePeriodRange(preset);
            state.period.from = r.from;
            state.period.to = r.to;
            $('periodLabel').textContent = r.label;
            localStorage.setItem(PERIOD_KEY, preset);
        }
        document.querySelectorAll('.period-btn').forEach((b) =>
            b.classList.toggle('active', b.dataset.period === preset)
        );
        $('customDateRange').classList.toggle('hidden-soft', preset !== 'custom');
        return refreshAll();
    }

    // ---------- Polling / Refresh ----------
    function startPolling() {
        if (state.pollTimer) return;
        setConnection(true);
        const tick = async () => {
            if (!state.token) return;
            try {
                await pollOrders();
                setConnection(true);
            } catch (e) {
                console.warn('Poll falhou:', e.message);
                setConnection(false);
            } finally {
                if (state.token) {
                    const delay = document.hidden ? POLL_INTERVAL_HIDDEN_MS : POLL_INTERVAL_MS;
                    state.pollTimer = setTimeout(tick, delay);
                }
            }
        };
        tick();
        clearInterval(state.statsTimer);
        state.statsTimer = setInterval(() => { if (state.token) refreshStats().catch(() => {}); }, STATS_REFRESH_MS);
    }
    function stopPolling() {
        if (state.pollTimer) { clearTimeout(state.pollTimer); state.pollTimer = null; }
        clearInterval(state.statsTimer);
        setConnection(false);
    }

    async function pollOrders() {
        if (state.polling) return;
        state.polling = true;
        try {
            const qs = new URLSearchParams();
            qs.set('limit', '500');
            if (state.period.from) qs.set('from', state.period.from.toISOString());
            if (state.period.to) qs.set('to', state.period.to.toISOString());

            const data = await api(`/api/orders?${qs}`);
            const incoming = data.orders || [];
            const incomingIds = new Set(incoming.map((o) => o._id));

            let newCount = 0;
            let firstNewOrder = null;

            for (const o of incoming) {
                const existing = state.ordersIndex.get(o._id);
                if (!existing) {
                    if (state.firstLoadDone) {
                        newCount++;
                        if (!firstNewOrder) firstNewOrder = o;
                    }
                }
                state.ordersIndex.set(o._id, o);
            }
            for (const id of Array.from(state.ordersIndex.keys())) {
                if (!incomingIds.has(id)) state.ordersIndex.delete(id);
            }

            state.orders = incoming.slice();
            state.firstLoadDone = true;

            renderOrders();
            updateOrdersBadge();

            if (newCount > 0) {
                playDing();
                const bell = $('bellIcon');
                if (bell) { bell.classList.add('wiggle'); setTimeout(() => bell.classList.remove('wiggle'), 1800); }
                showToast(newCount === 1
                    ? `Novo pedido de ${firstNewOrder?.customer?.fullName || 'cliente'}!`
                    : `${newCount} novos pedidos chegaram!`, 'success');
                document.title = `(${countActive()}) Painel | 100 Cinco`;
                refreshStats().catch(() => {});
            }
        } finally {
            state.polling = false;
        }
    }

    async function refreshStats() {
        try {
            const qs = new URLSearchParams();
            if (state.period.from) qs.set('from', state.period.from.toISOString());
            if (state.period.to) qs.set('to', state.period.to.toISOString());
            const data = await api(`/api/orders/stats/range?${qs}`);
            state.stats = data;
            renderDashboard();
        } catch (e) {
            console.warn('Stats falhou:', e.message);
        }
    }

    async function refreshAll() {
        // Reset state porque o período mudou
        state.firstLoadDone = false;
        state.ordersIndex.clear();
        state.orders = [];
        await Promise.all([pollOrders().catch(() => {}), refreshStats().catch(() => {})]);
    }

    function setConnection(online) {
        const dot = $('connectionDot');
        const txt = $('connectionText');
        if (!dot) return;
        if (online) {
            dot.classList.remove('offline'); dot.classList.add('online');
            txt.textContent = document.hidden ? 'Background' : 'Online';
        } else {
            dot.classList.remove('online'); dot.classList.add('offline');
            txt.textContent = 'Offline';
        }
    }

    function countActive() {
        return state.orders.filter((o) => o.status !== 'entregue' && o.status !== 'cancelado').length;
    }
    function updateOrdersBadge() {
        const active = countActive();
        const badge = $('navOrdersBadge');
        badge.textContent = active;
        badge.classList.toggle('hidden-soft', active === 0);
    }

    // ---------- View routing ----------
    function setView(view) {
        state.view = view;
        document.querySelectorAll('[data-view]').forEach((el) =>
            el.classList.toggle('active', el.dataset.view === view)
        );
        $('viewDashboard').classList.toggle('hidden-soft', view !== 'dashboard');
        $('viewOrders').classList.toggle('hidden-soft', view !== 'orders');
        $('viewCustomers').classList.toggle('hidden-soft', view !== 'customers');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (view === 'dashboard') refreshStats().catch(() => {});
        if (view === 'customers') loadCustomers().catch(() => {});
    }

    // ---------- Customers ----------
    async function loadCustomers() {
        $('customersLoading').classList.remove('hidden-soft');
        try {
            const qs = new URLSearchParams();
            if (state.customerSearch) qs.set('search', state.customerSearch);
            qs.set('sortBy', state.customerSort);
            qs.set('limit', '200');
            const [list, stats] = await Promise.all([
                api(`/api/customers?${qs}`),
                api('/api/customers/stats'),
            ]);
            state.customers = list.customers || [];
            state.customerStats = stats;
            renderCustomers();
        } catch (e) {
            showToast(`Erro: ${e.message}`, 'error');
        } finally {
            $('customersLoading').classList.add('hidden-soft');
        }
    }

    function renderCustomers() {
        const list = $('customersList');
        const empty = $('customersEmpty');
        const s = state.customerStats;
        if (s) {
            $('kpiCustomerTotal').textContent = fmtNum(s.total);
            $('kpiCustomerRepeat').textContent = fmtNum(s.repeatCustomers);
            $('kpiCustomerSpent').textContent = fmtBRL(s.totalSpent);
        }
        if (!state.customers.length) {
            list.innerHTML = '';
            empty.classList.remove('hidden-soft');
            return;
        }
        empty.classList.add('hidden-soft');
        list.innerHTML = state.customers.map((c) => customerCardHtml(c)).join('');
        if (window.lucide) lucide.createIcons();
    }

    function customerCardHtml(c) {
        const phoneClean = onlyDigits(c.phone);
        const isVip = (c.totalOrders || 0) >= 5;
        const isRepeat = (c.totalOrders || 0) >= 2;
        const lastAddr = (c.addresses || []).slice().sort((a, b) =>
            new Date(b.lastUsedAt) - new Date(a.lastUsedAt))[0];
        return `
        <article class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-soft transition-shadow card-enter">
            <div class="p-4 space-y-3">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 mb-0.5">
                            <h3 class="font-display font-bold text-brand-dark text-base truncate">${escapeHtml(c.fullName)}</h3>
                            ${isVip ? '<span class="status-badge status-entregue" title="5+ pedidos"><i data-lucide="crown" class="w-3 h-3"></i>VIP</span>' : (isRepeat ? '<span class="status-badge status-novo">Recorrente</span>' : '')}
                        </div>
                        <a href="https://wa.me/55${phoneClean}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-xs text-brand-green hover:underline font-medium">
                            <i data-lucide="message-circle" class="w-3 h-3"></i>${escapeHtml(c.phone)}
                        </a>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-2 text-center bg-gray-50 rounded-xl p-2">
                    <div>
                        <div class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pedidos</div>
                        <div class="font-display font-black text-base text-brand-dark">${c.totalOrders || 0}</div>
                    </div>
                    <div>
                        <div class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Gasto</div>
                        <div class="font-display font-black text-base text-brand-green">${fmtBRL(c.totalSpent)}</div>
                    </div>
                    <div>
                        <div class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cancelados</div>
                        <div class="font-display font-black text-base text-brand-berry">${c.cancelledOrders || 0}</div>
                    </div>
                </div>
                ${lastAddr ? `
                <div class="text-xs text-gray-500 flex items-start gap-1.5">
                    <i data-lucide="map-pin" class="w-3 h-3 text-brand-mango mt-0.5 flex-shrink-0"></i>
                    <span class="truncate">${escapeHtml(lastAddr.address)}, ${escapeHtml(lastAddr.number)} • <strong>${escapeHtml(lastAddr.city)}</strong></span>
                </div>` : ''}
                <div class="text-[10px] text-gray-400 flex items-center gap-1">
                    <i data-lucide="clock" class="w-2.5 h-2.5"></i>
                    Último pedido: <strong>${c.lastOrderAt ? fmtTime(c.lastOrderAt) : '—'}</strong>
                </div>
            </div>
            <div class="px-4 pb-4">
                <button onclick="window.openCustomerModal('${c._id}')" class="w-full btn-action btn-ghost">
                    <i data-lucide="eye" class="w-3.5 h-3.5"></i>Ver histórico
                </button>
            </div>
        </article>`;
    }

    window.openCustomerModal = async (id) => {
        $('customerModal').classList.remove('hidden-soft');
        $('customerModalBody').innerHTML = '<div class="text-center py-8"><i data-lucide="loader-2" class="w-6 h-6 text-brand-green mx-auto spinning"></i></div>';
        if (window.lucide) lucide.createIcons();
        try {
            const data = await api(`/api/customers/${id}`);
            const c = data.customer;
            const orders = data.orders || [];

            const addressesHtml = (c.addresses || [])
                .sort((a, b) => (b.timesUsed || 0) - (a.timesUsed || 0))
                .map((a) => `
                <div class="bg-gray-50 rounded-xl p-3 text-sm">
                    <div class="flex items-center justify-between mb-1">
                        <strong>${escapeHtml(a.city)}</strong>
                        <span class="text-[10px] font-bold text-gray-400 uppercase">${a.timesUsed}x usado</span>
                    </div>
                    <div class="text-xs text-gray-600">${escapeHtml(a.address)}, ${escapeHtml(a.number)}${a.complement ? ' — ' + escapeHtml(a.complement) : ''}${a.cep ? ' • CEP ' + escapeHtml(a.cep) : ''}</div>
                </div>`).join('');

            const ordersHtml = orders.map((o) => `
                <div class="flex items-center justify-between gap-2 py-2.5 border-b border-gray-100 last:border-0">
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                            <span class="status-badge status-${o.status}"><span class="status-dot"></span>${STATUS_LABEL[o.status]}</span>
                            <span class="text-[10px] font-mono font-bold text-gray-400">#${o._id.slice(-5).toUpperCase()}</span>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">${fmtDateTimeBR(o.createdAt)} • ${(o.items || []).reduce((s, i) => s + i.quantity, 0)} itens</div>
                    </div>
                    <div class="text-right">
                        <div class="font-display font-bold text-brand-dark">${fmtBRL(o.total)}</div>
                        <div class="text-[10px] text-gray-400">${o.payment}</div>
                    </div>
                </div>`).join('');

            $('customerModalBody').innerHTML = `
                <div class="space-y-5">
                    <div>
                        <h3 class="font-display font-black text-xl text-brand-dark">${escapeHtml(c.fullName)}</h3>
                        <a href="https://wa.me/55${onlyDigits(c.phone)}" target="_blank" rel="noopener" class="text-sm text-brand-green inline-flex items-center gap-1 mt-1">
                            <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>${escapeHtml(c.phone)}
                        </a>
                    </div>

                    <div class="grid grid-cols-3 gap-3">
                        <div class="stat-card"><div class="stat-card-label">Pedidos</div><div class="stat-card-value text-brand-dark">${c.totalOrders || 0}</div></div>
                        <div class="stat-card"><div class="stat-card-label">Total Gasto</div><div class="stat-card-value text-brand-green">${fmtBRL(c.totalSpent)}</div></div>
                        <div class="stat-card"><div class="stat-card-label">Cancelados</div><div class="stat-card-value text-brand-berry">${c.cancelledOrders || 0}</div></div>
                    </div>

                    <div class="text-xs text-gray-500 grid grid-cols-2 gap-2">
                        <div><span class="font-bold text-gray-400 uppercase">Primeiro pedido:</span><br>${c.firstOrderAt ? fmtDateTimeBR(c.firstOrderAt) : '—'}</div>
                        <div><span class="font-bold text-gray-400 uppercase">Último pedido:</span><br>${c.lastOrderAt ? fmtDateTimeBR(c.lastOrderAt) : '—'}</div>
                    </div>

                    <div>
                        <div class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Endereços (${c.addresses?.length || 0})</div>
                        <div class="space-y-2">${addressesHtml || '<div class="text-sm text-gray-400">Nenhum.</div>'}</div>
                    </div>

                    <div>
                        <div class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Anotações internas</div>
                        <textarea id="customerNotes" class="input-field" rows="3" placeholder="Ex.: prefere entrega à tarde, não come lácteos, deixar com o porteiro...">${escapeHtml(c.notes || '')}</textarea>
                        <button onclick="window.saveCustomerNotes('${c._id}')" class="btn-action btn-primary mt-2 w-full">
                            <i data-lucide="save" class="w-3.5 h-3.5"></i>Salvar anotações
                        </button>
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <div class="text-xs font-bold uppercase tracking-wider text-gray-400">Histórico de pedidos (${orders.length})</div>
                        </div>
                        <div class="rounded-xl border border-gray-100 bg-white px-3">${ordersHtml || '<div class="text-sm text-gray-400 py-4 text-center">Sem pedidos.</div>'}</div>
                    </div>
                </div>`;
            if (window.lucide) lucide.createIcons();
        } catch (e) {
            $('customerModalBody').innerHTML = `<div class="text-center py-8 text-brand-berry text-sm">Erro: ${escapeHtml(e.message)}</div>`;
        }
    };

    window.saveCustomerNotes = async (id) => {
        try {
            const notes = $('customerNotes').value.trim();
            await api(`/api/customers/${id}`, { method: 'PATCH', body: JSON.stringify({ notes }) });
            showToast('Anotações salvas.', 'success');
            loadCustomers().catch(() => {});
        } catch (e) {
            showToast(e.message, 'error');
        }
    };

    window.closeCustomerModal = () => $('customerModal').classList.add('hidden-soft');

    function exportCustomersCsv() {
        if (!state.customers.length) { showToast('Nada pra exportar.', 'info'); return; }
        const headers = ['Nome', 'Telefone', 'Pedidos', 'Cancelados', 'Total Gasto', 'Primeiro Pedido', 'Último Pedido', 'Endereços', 'Anotações'];
        const rows = [headers, ...state.customers.map((c) => [
            c.fullName,
            c.phone,
            c.totalOrders || 0,
            c.cancelledOrders || 0,
            (c.totalSpent || 0).toFixed(2).replace('.', ','),
            c.firstOrderAt ? fmtDateTimeBR(c.firstOrderAt) : '',
            c.lastOrderAt ? fmtDateTimeBR(c.lastOrderAt) : '',
            (c.addresses || []).map((a) => `${a.address}, ${a.number} - ${a.city}`).join(' | '),
            c.notes || '',
        ])];
        const date = new Date().toISOString().slice(0, 10);
        downloadCsv(`100cinco_clientes_${date}.csv`, rows);
        showToast(`${state.customers.length} clientes exportados.`, 'success');
    }

    // ---------- Dashboard render ----------
    function renderDashboard() {
        const s = state.stats;
        if (!s) return;

        $('kpiTotal').textContent = fmtNum(s.total);
        $('kpiRevenue').textContent = fmtBRL(s.revenue);
        $('kpiAvg').textContent = fmtBRL(s.avgTicket);
        const open = (s.byStatus.novo || 0) + (s.byStatus.em_preparo || 0) + (s.byStatus.saiu_para_entrega || 0);
        $('kpiOpen').textContent = fmtNum(open);

        renderSeriesChart(s.series);
        renderStatusChart(s.byStatus);
        renderTopProducts(s.topProducts);
        renderTopCities(s.topCities);
    }

    function renderSeriesChart(series) {
        const ctx = $('chartSeries').getContext('2d');
        const labels = series.map((d) => new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
        const counts = series.map((d) => d.count);
        const revenue = series.map((d) => d.revenue);

        if (state.charts.series) state.charts.series.destroy();
        state.charts.series = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Pedidos',
                        data: counts,
                        backgroundColor: 'rgba(16,185,129,0.85)',
                        borderRadius: 6,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Faturamento',
                        data: revenue,
                        type: 'line',
                        borderColor: '#F59E0B',
                        backgroundColor: 'rgba(245,158,11,0.1)',
                        borderWidth: 2,
                        tension: 0.35,
                        pointRadius: 3,
                        pointBackgroundColor: '#F59E0B',
                        yAxisID: 'y1',
                        fill: true,
                    },
                ],
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 11, weight: 600 } } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ctx.datasetIndex === 1
                                ? `Faturamento: ${fmtBRL(ctx.parsed.y)}`
                                : `Pedidos: ${ctx.parsed.y}`,
                        },
                    },
                },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 } }, grid: { color: '#F3F4F6' } },
                    y1: { beginAtZero: true, position: 'right', ticks: { callback: (v) => 'R$ ' + v, font: { size: 11 } }, grid: { display: false } },
                    x: { ticks: { font: { size: 10 } }, grid: { display: false } },
                },
            },
        });
    }

    function renderStatusChart(byStatus) {
        const ctx = $('chartStatus').getContext('2d');
        const order = ['novo', 'em_preparo', 'saiu_para_entrega', 'entregue', 'cancelado'];
        const labels = order.map((k) => STATUS_LABEL[k]);
        const data = order.map((k) => byStatus[k] || 0);
        const colors = order.map((k) => STATUS_COLOR[k]);

        if (state.charts.status) state.charts.status.destroy();
        state.charts.status = new Chart(ctx, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }] },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, padding: 10, font: { size: 11, weight: 600 } } },
                },
            },
        });
    }

    function renderTopProducts(products) {
        const el = $('topProducts');
        if (!products || products.length === 0) {
            el.innerHTML = '<div class="text-sm text-gray-400 text-center py-8">Nenhum pedido no período.</div>';
            return;
        }
        const max = Math.max(...products.map((p) => p.quantity));
        el.innerHTML = products.map((p, i) => `
            <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-md bg-brand-green/10 text-brand-green flex items-center justify-center text-xs font-bold flex-shrink-0">${i + 1}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline gap-2">
                        <span class="text-sm font-bold text-brand-dark truncate">${escapeHtml(p.name)}</span>
                        <span class="text-xs font-bold text-brand-green whitespace-nowrap">${p.quantity}x</span>
                    </div>
                    <div class="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div class="h-full bg-brand-green rounded-full" style="width: ${(p.quantity / max * 100).toFixed(0)}%"></div>
                    </div>
                    <div class="text-[10px] text-gray-400 mt-0.5">${fmtBRL(p.revenue)}</div>
                </div>
            </div>
        `).join('');
    }

    function renderTopCities(cities) {
        const el = $('topCities');
        if (!cities || cities.length === 0) {
            el.innerHTML = '<div class="text-sm text-gray-400 text-center py-8">Nenhum pedido no período.</div>';
            return;
        }
        const max = Math.max(...cities.map((c) => c.count));
        el.innerHTML = cities.map((c, i) => `
            <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-md bg-brand-mango/10 text-brand-mango flex items-center justify-center text-xs font-bold flex-shrink-0">${i + 1}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline gap-2">
                        <span class="text-sm font-bold text-brand-dark truncate">${escapeHtml(c.city)}</span>
                        <span class="text-xs font-bold text-brand-mango whitespace-nowrap">${c.count} pedido${c.count > 1 ? 's' : ''}</span>
                    </div>
                    <div class="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div class="h-full bg-brand-mango rounded-full" style="width: ${(c.count / max * 100).toFixed(0)}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ---------- Orders render ----------
    function matchesFilter(o) {
        if (state.filter !== 'all' && o.status !== state.filter) return false;
        if (state.search) {
            const q = state.search.toLowerCase();
            const hay = `${o.customer.fullName} ${o.customer.phone} ${o.customer.city}`.toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    }

    function renderOrders() {
        const list = $('ordersList');
        const empty = $('emptyState');
        const loading = $('loadingState');
        loading.classList.add('hidden-soft');

        const visible = state.orders.filter(matchesFilter);
        const counts = { all: state.orders.length, novo: 0, em_preparo: 0, saiu_para_entrega: 0, entregue: 0, cancelado: 0 };
        state.orders.forEach((o) => { counts[o.status]++; });
        Object.keys(counts).forEach((k) => { const el = $(`count-${k}`); if (el) el.textContent = counts[k]; });

        if (visible.length === 0) {
            list.innerHTML = '';
            empty.classList.remove('hidden-soft');
            return;
        }
        empty.classList.add('hidden-soft');
        list.innerHTML = visible.map((o) => orderCardHtml(o)).join('');
        if (window.lucide) lucide.createIcons();
    }

    function orderCardHtml(o) {
        const flow = STATUS_FLOW[o.status] || {};
        const id = o._id;
        const itemsCount = (o.items || []).reduce((s, i) => s + i.quantity, 0);
        const shortId = id.slice(-5).toUpperCase();
        const phoneClean = onlyDigits(o.customer.phone);
        const waLink = phoneClean ? `https://wa.me/55${phoneClean}` : '#';

        const nextBtn = flow.next
            ? `<button onclick="window.advanceStatus('${id}', '${flow.next}')" class="btn-action ${flow.nextBtn} flex-1">
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>${escapeHtml(flow.nextLabel)}
               </button>` : '';
        const cancelBtn = (o.status !== 'entregue' && o.status !== 'cancelado')
            ? `<button onclick="window.cancelOrder('${id}')" class="btn-action btn-danger" title="Cancelar"><i data-lucide="ban" class="w-3.5 h-3.5"></i></button>` : '';
        const reopenBtn = (o.status === 'cancelado' || o.status === 'entregue')
            ? `<button onclick="window.advanceStatus('${id}', 'novo')" class="btn-action btn-ghost" title="Reabrir"><i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i></button>` : '';

        return `
        <article class="card-enter bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-soft transition-shadow">
            <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="status-badge status-${o.status}"><span class="status-dot"></span>${STATUS_LABEL[o.status]}</span>
                    <span class="text-[10px] font-mono font-bold text-gray-400 uppercase">#${shortId}</span>
                </div>
                <span class="text-[10px] font-bold text-gray-400 whitespace-nowrap">${fmtTime(o.createdAt)}</span>
            </div>
            <div class="p-4 space-y-3">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                        <h3 class="font-display font-bold text-brand-dark text-base truncate">${escapeHtml(o.customer.fullName)}</h3>
                        <a href="${waLink}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-xs text-brand-green hover:underline font-medium mt-0.5">
                            <i data-lucide="message-circle" class="w-3 h-3"></i>${escapeHtml(o.customer.phone)}
                        </a>
                    </div>
                    <div class="text-right">
                        <div class="font-display font-black text-lg text-brand-dark leading-none">${fmtBRL(o.total)}</div>
                        <div class="text-[10px] text-gray-400 font-medium mt-0.5">${o.payment}</div>
                    </div>
                </div>
                <div class="bg-gray-50 rounded-xl p-3 text-xs space-y-1">
                    <div class="flex items-start gap-2">
                        <i data-lucide="map-pin" class="w-3.5 h-3.5 text-brand-mango mt-0.5 flex-shrink-0"></i>
                        <span class="text-gray-600 leading-snug">${escapeHtml(o.customer.address)}, ${escapeHtml(o.customer.number)}${o.customer.complement ? ' — ' + escapeHtml(o.customer.complement) : ''} • <strong>${escapeHtml(o.customer.city)}</strong></span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i data-lucide="calendar" class="w-3.5 h-3.5 text-brand-sky flex-shrink-0"></i>
                        <span class="text-gray-600">Entrega: <strong>${fmtDate(o.deliveryDate)}</strong></span>
                    </div>
                </div>
                <div class="flex items-center gap-2 text-xs">
                    <button onclick="window.openOrderModal('${id}')" class="text-brand-green hover:underline font-bold flex items-center gap-1">
                        <i data-lucide="eye" class="w-3 h-3"></i>Ver ${itemsCount} ${itemsCount === 1 ? 'item' : 'itens'}
                    </button>
                    <span class="text-gray-300">•</span>
                    <button onclick="window.printComanda('${id}')" class="text-brand-dark hover:underline font-bold flex items-center gap-1">
                        <i data-lucide="printer" class="w-3 h-3"></i>Comanda
                    </button>
                </div>
            </div>
            <div class="px-4 pb-4 flex items-center gap-2">${nextBtn}${reopenBtn}${cancelBtn}</div>
        </article>`;
    }

    // ---------- Status actions ----------
    window.advanceStatus = async (id, nextStatus) => {
        try {
            const data = await api(`/api/orders/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: nextStatus }),
            });
            const idx = state.orders.findIndex((o) => o._id === id);
            if (idx >= 0) state.orders[idx] = data.order;
            state.ordersIndex.set(id, data.order);
            renderOrders();
            updateOrdersBadge();
            refreshStats().catch(() => {});
            showToast(`Status: ${STATUS_LABEL[nextStatus]}`, 'success');
        } catch (e) { showToast(e.message, 'error'); }
    };
    window.cancelOrder = async (id) => {
        if (!confirm('Cancelar este pedido?')) return;
        await window.advanceStatus(id, 'cancelado');
    };
    window.confirmDelete = async (id) => {
        if (!confirm('Excluir PERMANENTEMENTE? Não dá pra desfazer.')) return;
        try {
            await api(`/api/orders/${id}`, { method: 'DELETE' });
            state.orders = state.orders.filter((o) => o._id !== id);
            state.ordersIndex.delete(id);
            renderOrders();
            updateOrdersBadge();
            refreshStats().catch(() => {});
            closeOrderModal();
            showToast('Pedido excluído.', 'success');
        } catch (e) { showToast(e.message, 'error'); }
    };

    // ---------- Modal ----------
    window.openOrderModal = (id) => {
        const o = state.orders.find((x) => x._id === id);
        if (!o) return;
        const itemsHtml = (o.items || []).map((i) => `
            <div class="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                <div class="flex items-center gap-3 min-w-0">
                    ${i.image ? `<img src="${escapeHtml(i.image)}" alt="" class="w-10 h-10 rounded-lg object-cover bg-gray-50 flex-shrink-0">` : ''}
                    <div class="min-w-0">
                        <div class="text-sm font-bold text-brand-dark truncate">${escapeHtml(i.name)}</div>
                        <div class="text-xs text-gray-400">${i.quantity}x • ${fmtBRL(i.price)}</div>
                    </div>
                </div>
                <div class="font-bold text-sm text-brand-dark whitespace-nowrap">${fmtBRL(i.subtotal)}</div>
            </div>
        `).join('');
        const historyHtml = (o.statusHistory || []).slice().reverse().map((h) => `
            <div class="flex items-center gap-2 text-xs text-gray-500">
                <span class="status-badge status-${h.status}"><span class="status-dot"></span>${STATUS_LABEL[h.status]}</span>
                <span>${fmtTime(h.changedAt)} ${h.changedBy ? '• por ' + escapeHtml(h.changedBy) : ''}</span>
            </div>
        `).join('');

        $('modalBody').innerHTML = `
            <div class="space-y-5">
                <div class="flex items-center justify-between">
                    <span class="status-badge status-${o.status}"><span class="status-dot"></span>${STATUS_LABEL[o.status]}</span>
                    <span class="text-xs font-mono text-gray-400">#${o._id.slice(-8).toUpperCase()}</span>
                </div>
                <div>
                    <div class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Cliente</div>
                    <div class="font-bold text-brand-dark">${escapeHtml(o.customer.fullName)}</div>
                    <a href="https://wa.me/55${onlyDigits(o.customer.phone)}" target="_blank" rel="noopener" class="text-xs text-brand-green inline-flex items-center gap-1 mt-1">
                        <i data-lucide="message-circle" class="w-3 h-3"></i> ${escapeHtml(o.customer.phone)}
                    </a>
                </div>
                <div>
                    <div class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Endereço</div>
                    <div class="text-sm text-brand-dark leading-snug">
                        ${escapeHtml(o.customer.address)}, ${escapeHtml(o.customer.number)}<br>
                        ${o.customer.complement ? escapeHtml(o.customer.complement) + '<br>' : ''}
                        <strong>${escapeHtml(o.customer.city)}</strong>${o.customer.cep ? ' • CEP ' + escapeHtml(o.customer.cep) : ''}
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div><div class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Entrega</div><div class="font-bold text-brand-dark">${fmtDate(o.deliveryDate)}</div></div>
                    <div><div class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Pagamento</div><div class="font-bold text-brand-dark">${escapeHtml(o.payment)}</div></div>
                </div>
                <div>
                    <div class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Itens</div>
                    <div class="rounded-xl border border-gray-100 bg-gray-50 px-3">${itemsHtml}</div>
                </div>
                <div class="bg-brand-dark text-white rounded-xl p-4 space-y-2">
                    <div class="flex justify-between text-sm text-gray-300"><span>Subtotal</span><span>${fmtBRL(o.subtotal)}</span></div>
                    <div class="flex justify-between text-sm text-gray-300"><span>Entrega</span><span>${o.deliveryFee > 0 ? fmtBRL(o.deliveryFee) : (o.deliveryFeeNote || 'A combinar')}</span></div>
                    <div class="flex justify-between items-end pt-2 border-t border-white/10">
                        <span class="text-sm font-bold">Total</span>
                        <span class="font-display font-black text-2xl text-brand-green">${fmtBRL(o.total)}</span>
                    </div>
                </div>
                ${o.notes ? `<div><div class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Observações</div><div class="text-sm text-brand-dark bg-yellow-50 border border-yellow-200 rounded-xl p-3">${escapeHtml(o.notes)}</div></div>` : ''}
                <div>
                    <div class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Histórico</div>
                    <div class="space-y-1.5">${historyHtml}</div>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.printComanda('${o._id}')" class="flex-1 btn-action btn-dark">
                        <i data-lucide="printer" class="w-4 h-4"></i>Imprimir comanda
                    </button>
                    <button onclick="window.confirmDelete('${o._id}')" class="btn-action btn-danger">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>`;
        $('orderModal').classList.remove('hidden-soft');
        if (window.lucide) lucide.createIcons();
    };
    window.closeOrderModal = () => $('orderModal').classList.add('hidden-soft');

    // ---------- PRINT: Comanda / Lista / Dashboard ----------
    function doPrint(html, title) {
        const area = $('printArea');
        area.innerHTML = html;
        const oldTitle = document.title;
        document.title = title;
        document.body.classList.add('printing');
        window.print();
        setTimeout(() => {
            document.body.classList.remove('printing');
            area.innerHTML = '';
            document.title = oldTitle;
        }, 500);
    }

    window.printComanda = (id) => {
        const o = state.orders.find((x) => x._id === id);
        if (!o) return;
        const itemsRows = (o.items || []).map((i) => `
            <tr>
                <td><strong>${i.quantity}x</strong></td>
                <td>${escapeHtml(i.name)}</td>
                <td style="text-align: right;">${fmtBRL(i.price)}</td>
                <td style="text-align: right;"><strong>${fmtBRL(i.subtotal)}</strong></td>
            </tr>`).join('');
        const html = `
        <div class="print-comanda">
            <div class="pc-header">
                <div>
                    <h1 style="font-size: 28px; margin: 0; color: #0A2517;">🍃 100 Cinco</h1>
                    <div style="font-size: 11px; color: #4B5563; margin-top: 4px;">Distribuidora</div>
                </div>
                <div style="text-align: right;">
                    <div class="pc-label">Comanda</div>
                    <div style="font-family: monospace; font-size: 16px; font-weight: 800;">#${o._id.slice(-8).toUpperCase()}</div>
                    <div style="font-size: 10px; color: #6B7280; margin-top: 4px;">Emitida: ${fmtDateTimeBR(new Date())}</div>
                </div>
            </div>

            <div class="pc-section" style="border-top: none; padding-top: 0;">
                <div class="pc-label">Cliente</div>
                <div style="font-size: 18px; font-weight: 800; color: #0A2517;">${escapeHtml(o.customer.fullName)}</div>
                <div style="font-size: 13px; color: #4B5563; margin-top: 2px;">📱 ${escapeHtml(o.customer.phone)}</div>
            </div>

            <div class="pc-section">
                <div class="pc-label">Endereço de entrega</div>
                <div class="pc-big-address" style="margin-top: 4px;">
                    📍 ${escapeHtml(o.customer.address)}, ${escapeHtml(o.customer.number)}<br>
                    ${o.customer.complement ? escapeHtml(o.customer.complement) + '<br>' : ''}
                    <strong style="color: #10B981; font-size: 16px;">${escapeHtml(o.customer.city)}</strong>${o.customer.cep ? ' — CEP ' + escapeHtml(o.customer.cep) : ''}
                </div>
            </div>

            <div class="pc-section">
                <div style="display: flex; gap: 16px;">
                    <div style="flex: 1;">
                        <div class="pc-label">Entrega para</div>
                        <div style="font-size: 16px; font-weight: 800;">📅 ${fmtDate(o.deliveryDate)}</div>
                    </div>
                    <div style="flex: 1;">
                        <div class="pc-label">Pagamento</div>
                        <div style="font-size: 16px; font-weight: 800;">💳 ${escapeHtml(o.payment)}</div>
                    </div>
                </div>
            </div>

            <div class="pc-section">
                <div class="pc-label">Itens</div>
                <table>
                    <thead><tr><th>Qtd</th><th>Produto</th><th style="text-align: right;">Unit.</th><th style="text-align: right;">Subtotal</th></tr></thead>
                    <tbody>${itemsRows}</tbody>
                </table>
            </div>

            ${o.notes ? `<div class="pc-section"><div class="pc-label">⚠️ Observações</div><div style="font-size: 13px; font-weight: 600; background: #FEF3C7; padding: 8px; border-radius: 4px; margin-top: 4px;">${escapeHtml(o.notes)}</div></div>` : ''}

            <div style="margin-top: 16px;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6B7280; padding: 4px 0;">
                    <span>Subtotal dos itens</span><span>${fmtBRL(o.subtotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6B7280; padding: 4px 0;">
                    <span>Taxa de entrega</span><span>${o.deliveryFee > 0 ? fmtBRL(o.deliveryFee) : (o.deliveryFeeNote || 'A combinar')}</span>
                </div>
            </div>
            <div class="pc-total">
                <span style="font-size: 14px; font-weight: 700;">TOTAL A RECEBER</span>
                <span class="pc-total-value">${fmtBRL(o.total)}</span>
            </div>

            <div class="pc-footer">
                Comanda gerada pelo Painel 100 Cinco — ${fmtDateTimeBR(new Date())}
            </div>
        </div>`;
        doPrint(html, `Comanda #${o._id.slice(-5).toUpperCase()}`);
    };

    function printOrdersList() {
        const visible = state.orders.filter(matchesFilter);
        if (visible.length === 0) {
            showToast('Nenhum pedido para imprimir.', 'info');
            return;
        }
        const rows = visible.map((o) => `
            <tr>
                <td><span style="font-family: monospace; font-weight: 800;">#${o._id.slice(-5).toUpperCase()}</span></td>
                <td><strong>${escapeHtml(o.customer.fullName)}</strong><br><span style="font-size: 10px; color: #6B7280;">${escapeHtml(o.customer.phone)}</span></td>
                <td>${escapeHtml(o.customer.city)}</td>
                <td>${fmtDate(o.deliveryDate)}</td>
                <td>${(o.items || []).map((i) => `${i.quantity}x ${escapeHtml(i.name)}`).join('<br>')}</td>
                <td style="text-align: right;"><strong>${fmtBRL(o.total)}</strong><br><span style="font-size: 10px;">${escapeHtml(o.payment)}</span></td>
                <td style="text-transform: uppercase; font-size: 10px; font-weight: 800; color: ${STATUS_COLOR[o.status]};">${STATUS_LABEL[o.status]}</td>
            </tr>`).join('');
        const periodLbl = $('periodLabel').textContent || '';
        const html = `
        <div class="print-comanda">
            <div class="pc-header">
                <div>
                    <h1 style="font-size: 24px; margin: 0;">🍃 100 Cinco — Pedidos</h1>
                    <div style="font-size: 11px; color: #4B5563; margin-top: 4px;">Período: ${escapeHtml(periodLbl)} • Total: ${visible.length} pedido(s)</div>
                </div>
                <div style="text-align: right; font-size: 10px; color: #6B7280;">${fmtDateTimeBR(new Date())}</div>
            </div>
            <table style="margin-top: 16px;">
                <thead><tr><th>ID</th><th>Cliente</th><th>Cidade</th><th>Entrega</th><th>Itens</th><th style="text-align: right;">Total</th><th>Status</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
            <div class="pc-footer">Lista de pedidos gerada pelo Painel 100 Cinco</div>
        </div>`;
        doPrint(html, `Lista de Pedidos — ${periodLbl}`);
    }

    function printDashboardReport() {
        const s = state.stats;
        if (!s) { showToast('Carregando dados...', 'info'); return; }
        const periodLbl = $('periodLabel').textContent || '';
        const open = (s.byStatus.novo || 0) + (s.byStatus.em_preparo || 0) + (s.byStatus.saiu_para_entrega || 0);
        const products = (s.topProducts || []).slice(0, 10).map((p, i) => `
            <tr><td>${i + 1}</td><td>${escapeHtml(p.name)}</td><td style="text-align: right;">${p.quantity}</td><td style="text-align: right;">${fmtBRL(p.revenue)}</td></tr>
        `).join('');
        const cities = (s.topCities || []).map((c, i) => `
            <tr><td>${i + 1}</td><td>${escapeHtml(c.city)}</td><td style="text-align: right;">${c.count}</td></tr>
        `).join('');
        const series = (s.series || []).map((d) => `
            <tr><td>${fmtDate(d.date)}</td><td style="text-align: right;">${d.count}</td><td style="text-align: right;">${fmtBRL(d.revenue)}</td></tr>
        `).join('');

        const html = `
        <div class="print-comanda">
            <div class="pc-header">
                <div>
                    <h1 style="font-size: 24px; margin: 0;">🍃 100 Cinco — Relatório</h1>
                    <div style="font-size: 11px; color: #4B5563; margin-top: 4px;">Período: ${escapeHtml(periodLbl)}</div>
                </div>
                <div style="text-align: right; font-size: 10px; color: #6B7280;">${fmtDateTimeBR(new Date())}</div>
            </div>

            <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                <div style="padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
                    <div class="pc-label">Total de Pedidos</div>
                    <div style="font-size: 22px; font-weight: 900; color: #0A2517;">${s.total}</div>
                </div>
                <div style="padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
                    <div class="pc-label">Faturamento</div>
                    <div style="font-size: 22px; font-weight: 900; color: #F59E0B;">${fmtBRL(s.revenue)}</div>
                </div>
                <div style="padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
                    <div class="pc-label">Ticket Médio</div>
                    <div style="font-size: 22px; font-weight: 900; color: #0EA5E9;">${fmtBRL(s.avgTicket)}</div>
                </div>
                <div style="padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
                    <div class="pc-label">Em Aberto</div>
                    <div style="font-size: 22px; font-weight: 900; color: #4C1D95;">${open}</div>
                </div>
            </div>

            <div class="pc-section">
                <div class="pc-label">Por status</div>
                <table>
                    <thead><tr><th>Status</th><th style="text-align: right;">Quantidade</th></tr></thead>
                    <tbody>
                        ${Object.entries(s.byStatus).map(([k, v]) => `<tr><td>${STATUS_LABEL[k]}</td><td style="text-align: right;">${v}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>

            <div class="pc-section">
                <div class="pc-label">Pedidos por dia</div>
                <table>
                    <thead><tr><th>Dia</th><th style="text-align: right;">Pedidos</th><th style="text-align: right;">Faturamento</th></tr></thead>
                    <tbody>${series}</tbody>
                </table>
            </div>

            <div class="pc-section">
                <div class="pc-label">Top produtos</div>
                <table>
                    <thead><tr><th>#</th><th>Produto</th><th style="text-align: right;">Qtde</th><th style="text-align: right;">Receita</th></tr></thead>
                    <tbody>${products}</tbody>
                </table>
            </div>

            <div class="pc-section">
                <div class="pc-label">Top cidades</div>
                <table>
                    <thead><tr><th>#</th><th>Cidade</th><th style="text-align: right;">Pedidos</th></tr></thead>
                    <tbody>${cities}</tbody>
                </table>
            </div>

            <div class="pc-footer">Relatório gerado pelo Painel 100 Cinco</div>
        </div>`;
        doPrint(html, `Relatório — ${periodLbl}`);
    }

    // ---------- CSV Export ----------
    function downloadCsv(filename, rows) {
        // BOM pra Excel reconhecer UTF-8
        const csv = '﻿' + rows.map((r) =>
            r.map((cell) => {
                const v = String(cell ?? '').replace(/"/g, '""');
                return `"${v}"`;
            }).join(';')
        ).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function exportOrdersCsv() {
        const visible = state.orders.filter(matchesFilter);
        if (visible.length === 0) { showToast('Nada pra exportar.', 'info'); return; }
        const headers = ['ID', 'Data', 'Cliente', 'Telefone', 'Cidade', 'Endereço', 'Número', 'Complemento', 'CEP', 'Entrega', 'Pagamento', 'Itens', 'Subtotal', 'Taxa', 'Total', 'Status', 'Observações'];
        const rows = [headers, ...visible.map((o) => [
            o._id,
            fmtDateTimeBR(o.createdAt),
            o.customer.fullName,
            o.customer.phone,
            o.customer.city,
            o.customer.address,
            o.customer.number,
            o.customer.complement || '',
            o.customer.cep || '',
            fmtDate(o.deliveryDate),
            o.payment,
            (o.items || []).map((i) => `${i.quantity}x ${i.name}`).join(' | '),
            o.subtotal.toFixed(2).replace('.', ','),
            (o.deliveryFee || 0).toFixed(2).replace('.', ','),
            o.total.toFixed(2).replace('.', ','),
            STATUS_LABEL[o.status],
            o.notes || '',
        ])];
        const date = new Date().toISOString().slice(0, 10);
        downloadCsv(`100cinco_pedidos_${date}.csv`, rows);
        showToast(`${visible.length} pedidos exportados.`, 'success');
    }

    function exportStatsCsv() {
        const s = state.stats;
        if (!s) { showToast('Carregando...', 'info'); return; }
        const date = new Date().toISOString().slice(0, 10);
        const rows = [
            ['Relatório 100 Cinco — Período', $('periodLabel').textContent || ''],
            [],
            ['Métrica', 'Valor'],
            ['Total de pedidos', s.total],
            ['Faturamento', s.revenue.toFixed(2).replace('.', ',')],
            ['Ticket médio', s.avgTicket.toFixed(2).replace('.', ',')],
            [],
            ['Por status', 'Quantidade'],
            ...Object.entries(s.byStatus).map(([k, v]) => [STATUS_LABEL[k], v]),
            [],
            ['Dia', 'Pedidos', 'Faturamento'],
            ...s.series.map((d) => [fmtDate(d.date), d.count, d.revenue.toFixed(2).replace('.', ',')]),
            [],
            ['Top produtos', 'Quantidade', 'Receita'],
            ...s.topProducts.map((p) => [p.name, p.quantity, p.revenue.toFixed(2).replace('.', ',')]),
            [],
            ['Top cidades', 'Pedidos'],
            ...s.topCities.map((c) => [c.city, c.count]),
        ];
        downloadCsv(`100cinco_relatorio_${date}.csv`, rows);
        showToast('Relatório exportado.', 'success');
    }

    // ---------- Event Wiring ----------
    function wireEvents() {
        $('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = $('loginBtn'); const err = $('loginError');
            err.classList.add('hidden-soft');
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 spinning"></i> Entrando...';
            if (window.lucide) lucide.createIcons();
            try {
                await login($('loginUser').value.trim(), $('loginPass').value);
                showDashboard();
                setPeriod(state.period.preset);
                startPolling();
                checkPushBanner();
                showToast('Bem-vindo!', 'success');
            } catch (e) {
                $('loginErrorMsg').textContent = e.message || 'Falha ao entrar';
                err.classList.remove('hidden-soft');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="log-in" class="w-4 h-4"></i> <span>Entrar no Painel</span>';
                if (window.lucide) lucide.createIcons();
            }
        });

        $('logoutBtn').addEventListener('click', () => { if (confirm('Sair?')) logout(); });

        // Nav tabs
        document.querySelectorAll('[data-view]').forEach((tab) => {
            tab.addEventListener('click', () => setView(tab.dataset.view));
        });

        // Period buttons
        document.querySelectorAll('.period-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (btn.dataset.period === 'custom') {
                    setPeriod('custom');
                } else {
                    setPeriod(btn.dataset.period);
                }
            });
        });
        $('applyCustomDate').addEventListener('click', () => {
            const from = $('dateFrom').value;
            const to = $('dateTo').value;
            if (!from || !to) { showToast('Selecione as duas datas.', 'error'); return; }
            setPeriod('custom', from, to);
        });

        // Status filter tabs
        document.querySelectorAll('.filter-tab').forEach((tab) => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('active'));
                tab.classList.add('active');
                state.filter = tab.dataset.filter;
                renderOrders();
            });
        });

        let searchTimer;
        $('searchInput').addEventListener('input', (e) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => { state.search = e.target.value.trim(); renderOrders(); }, 200);
        });

        $('soundToggle').addEventListener('click', () => {
            state.soundOn = !state.soundOn;
            localStorage.setItem(SOUND_KEY, state.soundOn ? '1' : '0');
            $('soundIcon').setAttribute('data-lucide', state.soundOn ? 'volume-2' : 'volume-x');
            if (window.lucide) lucide.createIcons();
            if (state.soundOn) playDing();
            showToast(state.soundOn ? 'Som ativado' : 'Som desativado', 'info');
        });

        $('notifyToggle').addEventListener('click', async () => {
            if (state.pushSubscribed) await unsubscribePush();
            else await subscribePush();
        });
        $('enablePushBtn').addEventListener('click', () => subscribePush());

        $('installBtn').addEventListener('click', async () => {
            if (!state.pwaInstallPrompt) return;
            state.pwaInstallPrompt.prompt();
            const { outcome } = await state.pwaInstallPrompt.userChoice;
            if (outcome === 'accepted') $('installBanner').classList.add('hidden-soft');
            state.pwaInstallPrompt = null;
        });

        $('exportOrdersCsvBtn').addEventListener('click', exportOrdersCsv);
        $('exportStatsCsvBtn').addEventListener('click', exportStatsCsv);
        $('printOrdersListBtn').addEventListener('click', printOrdersList);
        $('printDashboardBtn').addEventListener('click', printDashboardReport);
        $('exportCustomersCsvBtn').addEventListener('click', exportCustomersCsv);

        // Customers controls
        let customerSearchTimer;
        $('customerSearch').addEventListener('input', (e) => {
            clearTimeout(customerSearchTimer);
            customerSearchTimer = setTimeout(() => {
                state.customerSearch = e.target.value.trim();
                loadCustomers().catch(() => {});
            }, 300);
        });
        $('customerSort').addEventListener('change', (e) => {
            state.customerSort = e.target.value;
            loadCustomers().catch(() => {});
        });

        $('modalBackdrop').addEventListener('click', () => closeOrderModal());
        $('customerModalBackdrop').addEventListener('click', () => closeCustomerModal());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { closeOrderModal(); closeCustomerModal(); }
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && state.token) {
                if (state.pollTimer) { clearTimeout(state.pollTimer); state.pollTimer = null; }
                startPolling();
            }
        });
    }

    function applyTogglesInitialUI() {
        $('soundIcon').setAttribute('data-lucide', state.soundOn ? 'volume-2' : 'volume-x');
        updateBellIcon();
        // Setar default dates pro custom
        const today = new Date().toISOString().slice(0, 10);
        $('dateFrom').value = today;
        $('dateTo').value = today;
        $('dateFrom').max = today;
        $('dateTo').max = today;
    }

    // ---------- Init ----------
    async function init() {
        if (window.lucide) lucide.createIcons();
        applyTogglesInitialUI();
        wireEvents();
        await registerServiceWorker();

        if (await checkAuth()) {
            showDashboard();
            setPeriod(state.period.preset);
            startPolling();
            checkPushBanner();
        } else {
            showLogin();
        }
        if (window.lucide) lucide.createIcons();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
