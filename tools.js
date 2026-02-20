// TOOLS.JS — Stopwatch & Countdown Timer
document.addEventListener('DOMContentLoaded', () => {

    // ===== STOPWATCH =====
    let swInterval = null, swMs = 0, swRunning = false, swLaps = [];

    const pad = (n, len = 2) => String(n).padStart(len, '0');
    const fmtSW = ms => `${pad(Math.floor(ms / 60000))}:${pad(Math.floor((ms % 60000) / 1000))}.${pad(Math.floor((ms % 1000) / 10))}`;
    const fmtTimer = ms => {
        const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
        return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    };

    const updateSWDisplay = () => { const el = document.getElementById('sw-display'); if (el) el.textContent = fmtSW(swMs); };

    document.getElementById('sw-start')?.addEventListener('click', () => {
        const btn = document.getElementById('sw-start');
        if (swRunning) {
            clearInterval(swInterval); swRunning = false;
            if (btn) btn.innerHTML = '<i class="ph-bold ph-play"></i> Resume';
        } else {
            const start = Date.now() - swMs;
            swInterval = setInterval(() => { swMs = Date.now() - start; updateSWDisplay(); }, 30);
            swRunning = true;
            if (btn) btn.innerHTML = '<i class="ph-bold ph-pause"></i> Pause';
        }
    });

    document.getElementById('sw-reset')?.addEventListener('click', () => {
        clearInterval(swInterval); swRunning = false; swMs = 0; swLaps = [];
        updateSWDisplay();
        const btn = document.getElementById('sw-start'); if (btn) btn.innerHTML = '<i class="ph-bold ph-play"></i> Start';
        const lapsEl = document.getElementById('sw-laps'); if (lapsEl) lapsEl.innerHTML = '';
    });

    document.getElementById('sw-lap')?.addEventListener('click', () => {
        if (!swRunning) return;
        swLaps.push({ n: swLaps.length + 1, time: fmtSW(swMs) });
        const lapsEl = document.getElementById('sw-laps');
        if (lapsEl) lapsEl.innerHTML = [...swLaps].reverse().map(l => `
      <div class="lap-item"><span class="lap-n">Lap ${l.n}</span><span class="lap-t">${l.time}</span></div>`).join('');
    });

    // ===== COUNTDOWN TIMER =====
    let timerInterval = null, timerMs = 0, timerRunning = false, timerTotal = 0;
    const CIRC = 2 * Math.PI * 90;

    const updateTimerDisplay = () => {
        const el = document.getElementById('timer-display'); if (el) el.textContent = fmtTimer(timerMs);
        const ring = document.getElementById('timer-ring');
        if (ring && timerTotal > 0) {
            ring.style.strokeDasharray = CIRC;
            ring.style.strokeDashoffset = CIRC * (1 - timerMs / timerTotal);
        }
    };

    document.getElementById('timer-start')?.addEventListener('click', () => {
        const btn = document.getElementById('timer-start');
        if (!timerRunning && timerMs <= 0) {
            const h = parseInt(document.getElementById('th')?.value || 0);
            const m = parseInt(document.getElementById('tm')?.value || 0);
            const s = parseInt(document.getElementById('ts')?.value || 0);
            timerTotal = (h * 3600 + m * 60 + s) * 1000;
            if (timerTotal <= 0) { alert('Set a time first!'); return; }
            timerMs = timerTotal;
        }
        if (timerRunning) {
            clearInterval(timerInterval); timerRunning = false;
            if (btn) btn.innerHTML = '<i class="ph-bold ph-play"></i> Resume';
        } else {
            const end = Date.now() + timerMs;
            timerInterval = setInterval(() => {
                timerMs = Math.max(0, end - Date.now()); updateTimerDisplay();
                if (timerMs <= 0) {
                    clearInterval(timerInterval); timerRunning = false;
                    if (btn) btn.innerHTML = '<i class="ph-bold ph-play"></i> Start';
                    const disp = document.getElementById('timer-display');
                    if (disp) { disp.classList.add('timer-done'); setTimeout(() => disp.classList.remove('timer-done'), 3000); }
                }
            }, 100);
            timerRunning = true;
            if (btn) btn.innerHTML = '<i class="ph-bold ph-pause"></i> Pause';
        }
        updateTimerDisplay();
    });

    document.getElementById('timer-reset')?.addEventListener('click', () => {
        clearInterval(timerInterval); timerRunning = false; timerMs = 0; timerTotal = 0;
        ['th', 'tm', 'ts'].forEach(id => { const el = document.getElementById(id); if (el) el.value = '0'; });
        const btn = document.getElementById('timer-start'); if (btn) btn.innerHTML = '<i class="ph-bold ph-play"></i> Start';
        updateTimerDisplay();
        const ring = document.getElementById('timer-ring'); if (ring) ring.style.strokeDashoffset = CIRC;
    });

    // ===== TAB SWITCHING =====
    document.querySelectorAll('.tools-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tools-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tools-pane').forEach(p => p.classList.add('hidden'));
            document.getElementById(`tools-pane-${tab.dataset.tool}`)?.classList.remove('hidden');
        });
    });

    SCP.initTools = () => { updateSWDisplay(); updateTimerDisplay(); };
});
