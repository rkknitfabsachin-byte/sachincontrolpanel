// =============================================
// TASKS.JS — Task List with Priorities & Confetti
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    let currentFilter = 'all';
    let confettiAnimFrame = null;

    // ===== RENDER TASKS =====
    SCP.renderTasks = () => {
        const tasks = SCP.getData('scp_tasks', []);
        const list = document.getElementById('tasks-list');
        const empty = document.getElementById('tasks-empty');
        if (!list) return;

        let filtered = tasks;
        if (currentFilter === 'pending') filtered = tasks.filter(t => !t.completed);
        if (currentFilter === 'completed') filtered = tasks.filter(t => t.completed);

        if (filtered.length === 0) {
            list.innerHTML = '';
            empty?.classList.remove('hidden');
        } else {
            empty?.classList.add('hidden');
            list.innerHTML = filtered.map(t => renderTaskItem(t)).join('');
        }

        // Update badge
        const pending = tasks.filter(t => !t.completed).length;
        const badge = document.getElementById('tasks-badge');
        if (badge) { badge.textContent = pending; badge.classList.toggle('hidden', pending === 0); }
    };

    const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
    const PRIORITY_LABELS = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' };

    const renderTaskItem = (t) => {
        const color = PRIORITY_COLORS[t.priority] || '#10b981';
        const dueStr = t.dueDate ? ` · Due: ${t.dueDate}` : '';
        const completedClass = t.completed ? ' completed' : '';
        const checkContent = t.completed ? '✓' : '';
        return `<div class="task-item${completedClass}" data-id="${t.id}" style="--task-priority-color:${color}">
      <button class="task-check" onclick="SCP.toggleTask('${t.id}')" title="Mark ${t.completed ? 'incomplete' : 'complete'}">${checkContent}</button>
      <div class="task-body">
        <div class="task-title">${t.title}</div>
        <div class="task-meta">
          <span class="task-priority-badge" style="background:${color}22;color:${color};border:1px solid ${color}44">${PRIORITY_LABELS[t.priority] || t.priority}</span>
          ${t.dueDate ? `<span class="task-due">📅 ${t.dueDate}</span>` : ''}
        </div>
      </div>
      <button class="task-del" onclick="SCP.deleteTask('${t.id}')" title="Delete">🗑</button>
    </div>`;
    };

    // ===== TOGGLE TASK =====
    SCP.toggleTask = (id) => {
        const tasks = SCP.getData('scp_tasks', []);
        const t = tasks.find(x => x.id === id);
        if (!t) return;
        t.completed = !t.completed;
        SCP.setData('scp_tasks', tasks);
        SCP.renderTasks();
        SCP.refreshDashboard();
        if (t.completed) launchConfetti();
    };

    // ===== DELETE TASK =====
    SCP.deleteTask = (id) => {
        if (!confirm('Delete this task?')) return;
        let tasks = SCP.getData('scp_tasks', []);
        tasks = tasks.filter(x => x.id !== id);
        SCP.setData('scp_tasks', tasks);
        SCP.renderTasks();
        SCP.refreshDashboard();
    };

    // ===== ADD TASK MODAL =====
    document.getElementById('add-task-btn')?.addEventListener('click', () => {
        document.getElementById('task-title-input').value = '';
        document.getElementById('task-due-input').value = '';
        document.querySelectorAll('.priority-opt').forEach(o => o.classList.remove('active'));
        document.querySelector('.priority-opt[data-priority="low"]')?.classList.add('active');
        SCP.openModal('add-task-modal');
        setTimeout(() => document.getElementById('task-title-input')?.focus(), 100);
    });
    document.getElementById('cancel-add-task')?.addEventListener('click', () => SCP.closeModal('add-task-modal'));
    document.getElementById('confirm-add-task')?.addEventListener('click', () => {
        const title = document.getElementById('task-title-input')?.value.trim();
        if (!title) { alert('Enter a task title.'); return; }
        const dueDate = document.getElementById('task-due-input')?.value || null;
        const activePriority = document.querySelector('.priority-opt.active');
        const priority = activePriority?.dataset.priority || 'low';
        const tasks = SCP.getData('scp_tasks', []);
        tasks.push({ id: SCP.genId(), title, dueDate, priority, completed: false, createdAt: Date.now() });
        SCP.setData('scp_tasks', tasks);
        SCP.closeModal('add-task-modal');
        SCP.renderTasks();
        SCP.refreshDashboard();
    });

    // Priority option selection
    document.querySelectorAll('.priority-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.priority-opt').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        });
    });

    // ===== FILTER BUTTONS =====
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            SCP.renderTasks();
        });
    });

    // ===== CONFETTI =====
    const launchConfetti = () => {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.display = 'block';
        const ctx = canvas.getContext('2d');
        const colors = ['#00f5ff', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#ffffff'];
        const particles = [];
        for (let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                w: Math.random() * 10 + 4, h: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 4 + 2,
                vr: (Math.random() - 0.5) * 5
            });
        }
        let elapsed = 0;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy; p.rotation += p.vr;
                ctx.save(); ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, 1 - elapsed / 100);
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });
            elapsed++;
            if (elapsed < 120) { confettiAnimFrame = requestAnimationFrame(animate); }
            else { canvas.style.display = 'none'; ctx.clearRect(0, 0, canvas.width, canvas.height); }
        };
        if (confettiAnimFrame) cancelAnimationFrame(confettiAnimFrame);
        animate();
    };
});
