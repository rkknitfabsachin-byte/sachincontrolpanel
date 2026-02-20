// =============================================
// APP.JS — Core Logic: Init, Clock, Routing, Theme
// Sachin's Control Panel
// =============================================

window.SCP = {};

// ===== DATA UTILITIES =====
SCP.getData = (key, def = null) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
};
SCP.setData = (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.error(e); }
};
SCP.genId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

// ===== PARTICLES =====
SCP.initParticles = () => {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.5 + 0.3;
            this.vx = (Math.random() - 0.5) * 0.25;
            this.vy = (Math.random() - 0.5) * 0.25;
            this.alpha = Math.random() * 0.5 + 0.1;
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        draw() {
            const dark = document.documentElement.getAttribute('data-theme') !== 'light';
            ctx.save(); ctx.globalAlpha = this.alpha;
            ctx.fillStyle = dark ? '#00f5ff' : '#3b82f6';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }

    for (let i = 0; i < 90; i++) particles.push(new Particle());

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const dark = document.documentElement.getAttribute('data-theme') !== 'light';
        particles.forEach((p, i) => {
            particles.forEach((p2, j) => {
                if (i >= j) return;
                const dx = p.x - p2.x, dy = p.y - p2.y, d = Math.sqrt(dx * dx + dy * dy);
                if (d < 120) {
                    ctx.save(); ctx.globalAlpha = (1 - d / 120) * 0.12;
                    ctx.strokeStyle = dark ? '#00f5ff' : '#3b82f6';
                    ctx.lineWidth = 0.5;
                    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                    ctx.restore();
                }
            });
            p.update(); p.draw();
        });
        requestAnimationFrame(animate);
    };
    animate();
};

// ===== CLOCK =====
SCP.startClock = () => {
    const tick = () => {
        const now = new Date();
        let h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        const pad = n => String(n).padStart(2, '0');
        const hEl = document.getElementById('clock-h');
        const mEl = document.getElementById('clock-m');
        const sEl = document.getElementById('clock-s');
        const apEl = document.getElementById('clock-ampm');
        if (hEl) hEl.textContent = pad(h);
        if (mEl) mEl.textContent = pad(m);
        if (sEl) { sEl.textContent = pad(s); sEl.style.opacity = s % 2 === 0 ? '1' : '0.6'; }
        if (apEl) apEl.textContent = ampm;
    };
    tick(); setInterval(tick, 1000);
};

// ===== DATE =====
SCP.updateDate = () => {
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    const el = document.getElementById('greeting-date');
    if (el) el.textContent = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
};

// ===== PANEL NAVIGATION =====
SCP.currentPanel = 'dashboard';
SCP.navigateTo = (panelId) => {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`panel-${panelId}`);
    if (target) target.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll(`[data-panel="${panelId}"]`).forEach(n => { if (n.classList.contains('nav-item')) n.classList.add('active'); });
    const labels = { dashboard: 'Dashboard', files: 'Files', calendar: 'Calendar', tasks: 'Tasks', profile: 'Profile', notes: 'Notes Corner', calculator: 'Calculator', tools: 'Tools', snake: 'Snake Game' };
    const bc = document.getElementById('breadcrumb');
    if (bc) bc.textContent = labels[panelId] || panelId;
    SCP.currentPanel = panelId;
    if (panelId === 'dashboard') SCP.refreshDashboard && SCP.refreshDashboard();
    if (panelId === 'files') SCP.renderFiles && SCP.renderFiles();
    if (panelId === 'calendar') SCP.renderCalendar && SCP.renderCalendar();
    if (panelId === 'tasks') SCP.renderTasks && SCP.renderTasks();
    if (panelId === 'profile') SCP.renderProfile && SCP.renderProfile();
    if (panelId === 'notes') SCP.renderNotes && SCP.renderNotes();
    if (panelId === 'calculator') SCP.initCalculator && SCP.initCalculator();
    if (panelId === 'tools') SCP.initTools && SCP.initTools();
    if (panelId === 'snake') SCP.initSnake && SCP.initSnake();
};

// ===== THEME =====
SCP.applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    const t = document.getElementById('theme-toggle');
    if (t) t.checked = theme === 'light';
};
SCP.toggleTheme = () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.body.classList.add('theme-switching');
    setTimeout(() => document.body.classList.remove('theme-switching'), 600);
    SCP.applyTheme(next);
    const p = SCP.getData('scp_profile', {});
    p.theme = next; SCP.setData('scp_profile', p);
};

// ===== ACCENT COLOR =====
SCP.applyAccent = (color) => {
    document.documentElement.setAttribute('data-accent', color || 'cyan');
    if (color && color.startsWith('#')) {
        // Apply custom hex directly
        document.documentElement.style.setProperty('--accent', color);
        // Calculate RGB for transparency support
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
        }
    } else {
        // Reset manual overrides for presets
        document.documentElement.style.removeProperty('--accent');
        document.documentElement.style.removeProperty('--accent-rgb');
    }
};

// ===== MODAL HELPERS =====
SCP.openModal = (id) => { const m = document.getElementById(id); if (m) m.classList.remove('hidden'); };
SCP.closeModal = (id) => { const m = document.getElementById(id); if (m) m.classList.add('hidden'); };

// ===== COLOR OPTIONS =====
SCP.initColorOptions = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.color-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            container.querySelectorAll('.color-opt').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        });
    });
};
SCP.getSelectedColor = (containerId) => {
    const c = document.getElementById(containerId);
    if (!c) return null;
    const a = c.querySelector('.color-opt.active');
    return a ? (a.dataset.color || a.style.background) : null;
};
SCP.setActiveColor = (containerId, colorVal) => {
    const c = document.getElementById(containerId);
    if (!c) return;
    c.querySelectorAll('.color-opt').forEach(o => {
        o.classList.remove('active');
        if (o.dataset.color === colorVal || o.style.background === colorVal) o.classList.add('active');
    });
};

// ===== RIPPLE =====
SCP.addRipple = (btn) => {
    btn.addEventListener('click', function (e) {
        const r = document.createElement('div'); r.className = 'ripple-effect';
        const rect = this.getBoundingClientRect();
        r.style.left = `${e.clientX - rect.left}px`;
        r.style.top = `${e.clientY - rect.top}px`;
        this.style.position = 'relative'; this.style.overflow = 'hidden';
        this.appendChild(r);
        setTimeout(() => r.remove(), 700);
    });
};

// ===== FILE ICON =====
SCP.getFileIcon = (url) => {
    if (!url) return '🔗';
    const u = url.toLowerCase();
    if (u.includes('docs.google.com/spreadsheets')) return '📊';
    if (u.includes('docs.google.com/document')) return '📄';
    if (u.includes('docs.google.com/presentation')) return '📑';
    if (u.includes('docs.google.com/forms')) return '📋';
    if (u.includes('drive.google.com')) return '💾';
    if (u.includes('youtube.com') || u.includes('youtu.be')) return '▶️';
    if (u.includes('github.com')) return '🐙';
    if (u.includes('notion.so')) return '📓';
    if (u.includes('figma.com')) return '🎨';
    if (u.includes('trello.com')) return '📌';
    if (u.includes('zoom.us')) return '📹';
    if (u.includes('slack.com')) return '💬';
    if (u.includes('.pdf')) return '📕';
    if (u.includes('.png') || u.includes('.jpg') || u.includes('.jpeg') || u.includes('.gif')) return '🖼️';
    return '🔗';
};

// ===== DASHBOARD REFRESH =====
SCP.refreshDashboard = () => {
    const files = SCP.getData('scp_files', []);
    const tasks = SCP.getData('scp_tasks', []);
    const events = SCP.getData('scp_events', []);
    const drive = SCP.getData('scp_drive_files', []);

    const pending = tasks.filter(t => !t.completed).length;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('stat-files', files.length + drive.length);
    set('stat-tasks', pending);
    set('stat-events', events.length);

    // Holidays count
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const allHolidays = SCP.getData('scp_holidays', []);
    const upcoming = allHolidays.filter(h => new Date(h.date + 'T00:00:00') >= today);
    set('stat-holidays', allHolidays.length);

    // Tasks badge
    const badge = document.getElementById('tasks-badge');
    if (badge) { badge.textContent = pending; badge.classList.toggle('hidden', pending === 0); }

    // Recent files
    const rEl = document.getElementById('dashboard-recent-files');
    if (rEl) {
        const recent = [...files].reverse().slice(0, 4);
        rEl.innerHTML = recent.length === 0
            ? '<p class="empty-text">No files added yet</p>'
            : recent.map(f => `<div class="recent-file-item" onclick="window.open('${f.url}','_blank')">
          <span class="rf-icon">${SCP.getFileIcon(f.url)}</span>
          <span class="rf-label">${f.label}</span>
          <span class="rf-arrow">→</span>
        </div>`).join('');
    }

    // Pending tasks
    const ptEl = document.getElementById('dashboard-pending-tasks');
    if (ptEl) {
        const pt = tasks.filter(t => !t.completed).slice(0, 4);
        ptEl.innerHTML = pt.length === 0
            ? '<p class="empty-text">No pending tasks 🎉</p>'
            : pt.map(t => `<div class="pending-task-item">
          <span class="pt-priority">${t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢'}</span>
          <span class="pt-title">${t.title}</span>
          ${t.dueDate ? `<span class="pt-due">${t.dueDate}</span>` : ''}
        </div>`).join('');
    }

    // Upcoming holidays
    const hEl = document.getElementById('dashboard-holidays');
    if (hEl) {
        const allHols = SCP.getData('scp_holidays', []);
        const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
        const next = allHols.filter(h => new Date(h.date + 'T00:00:00') >= todayD).slice(0, 5);
        hEl.innerHTML = next.length === 0
            ? '<p class="empty-text">No upcoming holidays — add some in Calendar!</p>'
            : next.map(h => {
                const d = new Date(h.date + 'T00:00:00');
                const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
                return `<div class="holiday-item">
            <span class="hi-date">${mon} ${d.getDate()}</span>
            <span class="hi-name">${h.name}</span>
          </div>`;
            }).join('');
    }
};

// ===== CONTEXT MENU =====
SCP._ctxTarget = null;
SCP._ctxType = null;
SCP.showContextMenu = (e, id, type) => {
    e.preventDefault(); e.stopPropagation();
    SCP._ctxTarget = id; SCP._ctxType = type;
    const menu = document.getElementById('context-menu');
    if (!menu) return;
    menu.classList.remove('hidden');
    const menuW = 180, menuH = 164;
    let x = e.clientX, y = e.clientY;
    if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 8;
    if (y + menuH > window.innerHeight) y = window.innerHeight - menuH - 8;
    menu.style.left = x + 'px'; menu.style.top = y + 'px';
    const openItem = menu.querySelector('[data-action="open"]');
    const moveItem = menu.querySelector('[data-action="move"]');
    if (openItem) openItem.style.display = type === 'file' ? 'flex' : 'none';
    if (moveItem) moveItem.style.display = type === 'file' ? 'flex' : 'none';
};

// ===== APP INIT =====
document.addEventListener('DOMContentLoaded', () => {
    SCP.initParticles();
    SCP.startClock();
    SCP.updateDate();

    // Load profile
    const profile = SCP.getData('scp_profile', null);
    if (!profile) {
        SCP.openModal('profile-setup-modal');
    } else {
        SCP.applyTheme(profile.theme || 'dark');
        SCP.applyAccent(profile.accent || 'cyan');
        SCP.updateSidebarProfile(profile);
        SCP.refreshDashboard();
    }

    // Nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            SCP.navigateTo(item.dataset.panel);
        });
    });

    // Card links
    document.querySelectorAll('.card-link').forEach(link => {
        link.addEventListener('click', e => { e.preventDefault(); SCP.navigateTo(link.dataset.panel); });
    });

    // Sidebar profile click
    document.getElementById('sidebar-profile-link')?.addEventListener('click', () => SCP.navigateTo('profile'));

    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('change', SCP.toggleTheme);

    // Hamburger
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
        const sb = document.getElementById('sidebar');
        if (window.innerWidth <= 768) { sb.classList.toggle('mobile-open'); }
        else { sb.classList.toggle('collapsed'); }
    });

    // Search
    document.getElementById('search-btn')?.addEventListener('click', () => {
        SCP.openModal('search-overlay');
        setTimeout(() => document.getElementById('global-search-input')?.focus(), 100);
    });
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); SCP.openModal('search-overlay'); setTimeout(() => document.getElementById('global-search-input')?.focus(), 100); }
        if (e.key === 'Escape') {
            SCP.closeModal('search-overlay');
            document.getElementById('context-menu')?.classList.add('hidden');
        }
    });
    document.getElementById('close-search')?.addEventListener('click', () => SCP.closeModal('search-overlay'));

    // Close context menu on click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.context-menu')) document.getElementById('context-menu')?.classList.add('hidden');
    });

    // Context menu actions
    document.querySelectorAll('.ctx-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            const id = SCP._ctxTarget; const type = SCP._ctxType;
            document.getElementById('context-menu')?.classList.add('hidden');
            if (!id) return;
            if (action === 'rename') { SCP.renameItem && SCP.renameItem(id, type); }
            if (action === 'delete') { SCP.deleteItem && SCP.deleteItem(id, type); }
            if (action === 'move') { SCP.showMoveModal && SCP.showMoveModal(id); }
            if (action === 'open') {
                const files = SCP.getData('scp_files', []);
                const f = files.find(x => x.id === id);
                if (f && f.url) window.open(f.url, '_blank');
            }
        });
    });

    // Ripple on primary buttons
    document.querySelectorAll('.btn-primary').forEach(SCP.addRipple);

    // Color options init
    ['setup-color-options', 'file-color-options', 'folder-color-options', 'event-color-options', 'profile-color-options'].forEach(SCP.initColorOptions);

    // Sync Logic Init
    SCP.initSync();
});

// ===== SIDEBAR PROFILE UPDATER =====
SCP.updateSidebarProfile = (profile) => {
    if (!profile) return;
    const name = document.getElementById('sidebar-name');
    const tagline = document.getElementById('sidebar-tagline');
    const avatar = document.getElementById('sidebar-avatar');
    const greeting = document.getElementById('greeting-text');
    if (name) name.textContent = profile.name || 'Sachin';
    if (tagline) tagline.textContent = profile.tagline || '';
    if (greeting) greeting.textContent = `Welcome back, ${profile.name || 'Sachin'} ✨`;
    if (avatar) {
        if (profile.avatar) { avatar.innerHTML = `<img src="${profile.avatar}" alt="avatar">`; }
        else { avatar.textContent = (profile.name || 'S')[0].toUpperCase(); }
    }
    SCP.applyAccent(profile.accent || 'cyan');
};

// ===== CLOUD SYNC LOGIC (Gist Based) =====
SCP.initSync = () => {
    const syncBtn = document.getElementById('nav-sync-btn');
    const saveSync = document.getElementById('save-sync');
    const cancelSync = document.getElementById('cancel-sync');
    const statusDot = document.getElementById('sync-status');

    syncBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        const settings = SCP.getData('scp_sync_settings', { token: '', gistId: '' });
        document.getElementById('sync-token-input').value = settings.token;
        document.getElementById('sync-gist-id').value = settings.gistId;
        SCP.openModal('sync-modal');
    });

    cancelSync?.addEventListener('click', () => SCP.closeModal('sync-modal'));

    saveSync?.addEventListener('click', async () => {
        const token = document.getElementById('sync-token-input').value.trim();
        const gistId = document.getElementById('sync-gist-id').value.trim();
        if (!token) { alert('Please enter a GitHub Token.'); return; }

        statusDot?.classList.add('syncing');
        saveSync.textContent = 'Connecting...';

        try {
            const result = await SCP.syncWithCloud(token, gistId);
            SCP.setData('scp_sync_settings', { token, gistId: result.id });
            alert('Cloud Sync Enabled! Your data is now securely stored in GitHub Gists.');

            // Show share link
            SCP.updateShareLink(result.id);

            // Note: Keep modal open so user can see/copy the link
            statusDot?.classList.add('online');
            statusDot?.classList.remove('syncing');
        } catch (err) {
            console.error(err);
            alert('Sync failed. Check your token scope (must have "gist").');
            statusDot?.classList.add('error');
            statusDot?.classList.remove('syncing');
        } finally {
            saveSync.textContent = 'Enable Sync';
        }
    });

    // Auto-sync check on load
    const settings = SCP.getData('scp_sync_settings', null);
    if (settings && settings.token && settings.gistId) {
        SCP.pullFromCloud(settings.token, settings.gistId);
        SCP.updateShareLink(settings.gistId);
    }

    // Check URL for gist ID (Sharing functionality)
    const hash = window.location.hash;
    if (hash.startsWith('#gist=')) {
        const urlGistId = hash.replace('#gist=', '');
        const currentSettings = SCP.getData('scp_sync_settings', { token: '', gistId: '' });
        if (currentSettings.gistId !== urlGistId) {
            document.getElementById('sync-gist-id').value = urlGistId;
            SCP.openModal('sync-modal');
            alert('Gist ID loaded from link! Enter your GitHub token to sync.');
        }
    }

    // Copy share link logic
    document.getElementById('copy-share-link')?.addEventListener('click', () => {
        const inp = document.getElementById('share-link-input');
        if (inp) {
            inp.select();
            document.execCommand('copy');
            const btn = document.getElementById('copy-share-link');
            const orig = btn.textContent;
            btn.textContent = '✅';
            setTimeout(() => { btn.textContent = orig; }, 2000);
        }
    });
};

SCP.updateShareLink = (gistId) => {
    const container = document.getElementById('share-link-container');
    const input = document.getElementById('share-link-input');
    if (container && input && gistId) {
        const base = window.location.href.split('#')[0];
        input.value = `${base}#gist=${gistId}`;
        container.classList.remove('hidden');
    }
};

SCP.syncWithCloud = async (token, gistId = '') => {
    const keys = ['scp_profile', 'scp_files', 'scp_folders', 'scp_tasks', 'scp_events', 'scp_holidays'];
    const data = {};
    keys.forEach(k => data[k] = localStorage.getItem(k));

    const method = gistId ? 'PATCH' : 'POST';
    const url = gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists';

    const response = await fetch(url, {
        method,
        headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            description: "Sachin's Control Panel Sync Data",
            public: false,
            files: { 'scp_data.json': { content: JSON.stringify(data) } }
        })
    });

    if (!response.ok) throw new Error('GitHub API Error');
    return await response.json();
};

SCP.pullFromCloud = async (token, gistId) => {
    const statusDot = document.getElementById('sync-status');
    statusDot?.classList.add('syncing');
    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: { 'Authorization': `token ${token}` }
        });
        const gist = await response.json();
        const content = JSON.parse(gist.files['scp_data.json'].content);

        Object.keys(content).forEach(key => {
            if (content[key]) localStorage.setItem(key, content[key]);
        });

        statusDot?.classList.add('online');
        statusDot?.classList.remove('syncing');

        // Refresh Current Panel logic
        if (SCP.currentPanel === 'dashboard') SCP.refreshDashboard();
        if (SCP.currentPanel === 'files') SCP.renderFiles();
        if (SCP.currentPanel === 'calendar') SCP.renderCalendar();
        if (SCP.currentPanel === 'tasks') SCP.renderTasks();
        if (SCP.currentPanel === 'profile') SCP.renderProfile();

        // Apply profile theme/accent immediately
        const p = content['scp_profile'] ? JSON.parse(content['scp_profile']) : {};
        if (p.theme) SCP.applyTheme(p.theme);
        if (p.accent) SCP.applyAccent(p.accent);
        SCP.updateSidebarProfile(p);
    } catch (e) {
        console.error(e);
        statusDot?.classList.add('error');
    }
};

// Deep sync for setData
const _originalSetData = SCP.setData;
SCP.setData = (key, val) => {
    _originalSetData(key, val);
    const settings = SCP.getData('scp_sync_settings', null);
    if (settings && settings.token && settings.gistId && key.startsWith('scp_')) {
        SCP.syncWithCloud(settings.token, settings.gistId).catch(() => { });
    }
};
