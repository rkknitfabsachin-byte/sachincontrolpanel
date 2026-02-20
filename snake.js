// SNAKE.JS — Snake Game with Levels & Particles
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('snake-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const CELL = 20, COLS = canvas.width / CELL, ROWS = canvas.height / CELL;

    const LEVELS = [
        { name: 'Beginner', speed: 170, color: '#10b981', pts: 10, food: 1 },
        { name: 'Advanced', speed: 110, color: '#f59e0b', pts: 20, food: 2 },
        { name: 'Expert', speed: 75, color: '#ef4444', pts: 30, food: 2 },
        { name: 'Nightmare', speed: 45, color: '#a855f7', pts: 50, food: 3 },
    ];

    let snake, dir, nextDir, food, score, level = 0, gameLoop, state = 'idle', particles = [];

    const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };

    const init = (lvl = 0) => {
        level = lvl; score = 0; particles = [];
        const mid = { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) };
        snake = [mid, { x: mid.x - 1, y: mid.y }, { x: mid.x - 2, y: mid.y }];
        dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 }; food = [];
        spawnFood(); updateUI();
    };

    const spawnFood = () => {
        while (food.length < LEVELS[level].food) {
            const pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
            if (!snake.some(s => s.x === pos.x && s.y === pos.y) && !food.some(f => f.x === pos.x && f.y === pos.y)) food.push(pos);
        }
    };

    const updateUI = () => {
        const scoreEl = document.getElementById('snake-score'), lvlEl = document.getElementById('snake-level-name');
        if (scoreEl) scoreEl.textContent = score;
        if (lvlEl) lvlEl.textContent = LEVELS[level].name;
        renderHiScores();
    };

    const renderHiScores = () => {
        const el = document.getElementById('snake-hiscores'); if (!el) return;
        const hi = SCP.getData('scp_snake_hi', [0, 0, 0, 0]);
        el.innerHTML = LEVELS.map((l, i) => `<div class="hi-row"><span style="color:${l.color}">${l.name}</span><strong>${hi[i] || 0}</strong></div>`).join('');
    };

    const draw = () => {
        ctx.fillStyle = '#050914'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0,245,255,0.03)';
        for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2);

        const col = LEVELS[level].color;
        food.forEach(f => { ctx.shadowBlur = 14; ctx.shadowColor = '#ef4444'; ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(f.x * CELL + CELL / 2, f.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; });

        snake.forEach((seg, i) => {
            ctx.shadowBlur = i === 0 ? 20 : 6; ctx.shadowColor = col;
            ctx.fillStyle = i === 0 ? '#ffffff' : col;
            rr(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, i === 0 ? 6 : 3); ctx.fill(); ctx.shadowBlur = 0;
        });

        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => { ctx.globalAlpha = p.life / 20; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 3, 3); p.x += p.vx; p.y += p.vy; p.life--; });
        ctx.globalAlpha = 1;
    };

    const burst = (x, y) => {
        const c = LEVELS[level].color;
        for (let i = 0; i < 14; i++) particles.push({ x: x * CELL + CELL / 2, y: y * CELL + CELL / 2, vx: (Math.random() - .5) * 5, vy: (Math.random() - .5) * 5, life: 20, color: c });
    };

    const step = () => {
        dir = { ...nextDir };
        const head = { x: (snake[0].x + dir.x + COLS) % COLS, y: (snake[0].y + dir.y + ROWS) % ROWS };
        if (snake.some(s => s.x === head.x && s.y === head.y)) { endGame(); return; }
        snake.unshift(head);
        const ate = food.findIndex(f => f.x === head.x && f.y === head.y);
        if (ate !== -1) { score += LEVELS[level].pts; burst(head.x, head.y); food.splice(ate, 1); spawnFood(); updateUI(); }
        else snake.pop();
        draw();
    };

    const endGame = () => {
        clearInterval(gameLoop); state = 'gameover';
        const hi = SCP.getData('scp_snake_hi', [0, 0, 0, 0]);
        if (score > hi[level]) { hi[level] = score; SCP.setData('scp_snake_hi', hi); }
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ef4444'; ctx.font = 'bold 28px Orbitron,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 26);
        ctx.fillStyle = '#fff'; ctx.font = '16px Inter,sans-serif';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 8);
        ctx.fillStyle = 'var(--text-dim)'; ctx.font = '13px Inter,sans-serif';
        ctx.fillText('Press Space or click Restart', canvas.width / 2, canvas.height / 2 + 34);
        document.getElementById('restart-snake-btn')?.classList.remove('hidden');
        renderHiScores();
    };

    SCP.startSnake = (lvl) => {
        if (gameLoop) clearInterval(gameLoop);
        init(lvl !== undefined ? lvl : level);
        state = 'playing';
        document.getElementById('snake-start-screen')?.classList.add('hidden');
        document.getElementById('restart-snake-btn')?.classList.add('hidden');
        gameLoop = setInterval(step, LEVELS[level].speed);
        canvas.focus();
    };

    SCP.initSnake = () => {
        renderHiScores();
        if (state === 'playing') return;
        const ss = document.getElementById('snake-start-screen');
        if (ss) ss.classList.remove('hidden');
        const btns = document.getElementById('snake-level-btns');
        if (btns) btns.innerHTML = LEVELS.map((l, i) => `
      <button class="snake-lvl-btn" data-lvl="${i}" style="--lc:${l.color}"
        onclick="SCP._snakeLvl=${i};document.querySelectorAll('.snake-lvl-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">
        <span class="lvl-dot"></span>${l.name}<span class="lvl-pts">${l.pts}pts</span>
      </button>`).join('');
        // idle draw
        ctx.fillStyle = '#050914'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0,245,255,0.03)';
        for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2);
    };
    SCP._snakeLvl = 0;

    document.getElementById('snake-play-btn')?.addEventListener('click', () => SCP.startSnake(SCP._snakeLvl || 0));
    document.getElementById('restart-snake-btn')?.addEventListener('click', () => SCP.startSnake(level));

    document.addEventListener('keydown', (e) => {
        // Don't intercept keys if user is typing in an input or textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        // Only intercept if we are on the snake panel
        if (SCP.currentPanel !== 'snake') return;

        if (state === 'gameover' && e.code === 'Space') { e.preventDefault(); SCP.startSnake(level); return; }
        if (state !== 'playing') return;
        const map = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, KeyW: { x: 0, y: -1 }, KeyS: { x: 0, y: 1 }, KeyA: { x: -1, y: 0 }, KeyD: { x: 1, y: 0 } };
        const nd = map[e.code];
        if (nd && !(nd.x === -dir.x && nd.y === -dir.y)) { e.preventDefault(); nextDir = nd; }
    });
});
