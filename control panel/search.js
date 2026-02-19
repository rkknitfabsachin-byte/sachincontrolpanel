// =============================================
// SEARCH.JS — Global Search (Ctrl+K)
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    const overlay = document.getElementById('search-overlay');
    const input = document.getElementById('global-search-input');
    const results = document.getElementById('search-results');

    if (!input || !results) return;

    const search = (query) => {
        if (!query || query.trim().length < 1) {
            results.innerHTML = '<div class="search-no-results">Start typing to search files, folders, and tasks</div>';
            return;
        }
        const q = query.toLowerCase().trim();
        const hits = [];

        // Search files
        const files = SCP.getData('scp_files', []);
        files.forEach(f => {
            if (f.label.toLowerCase().includes(q) || (f.url || '').toLowerCase().includes(q)) {
                hits.push({ type: 'file', label: f.label, icon: SCP.getFileIcon(f.url), id: f.id, url: f.url, panel: 'files' });
            }
        });

        // Search folders
        const folders = SCP.getData('scp_folders', []);
        folders.forEach(f => {
            if (f.name.toLowerCase().includes(q)) {
                hits.push({ type: 'folder', label: f.name, icon: '📁', id: f.id, panel: 'files' });
            }
        });

        // Search tasks
        const tasks = SCP.getData('scp_tasks', []);
        tasks.forEach(t => {
            if (t.title.toLowerCase().includes(q)) {
                hits.push({ type: 'task', label: t.title, icon: t.completed ? '✅' : '⏳', id: t.id, panel: 'tasks' });
            }
        });

        // Search events
        const events = SCP.getData('scp_events', []);
        events.forEach(e => {
            if (e.title.toLowerCase().includes(q)) {
                hits.push({ type: 'event', label: `${e.title} (${e.date})`, icon: '📌', id: e.id, panel: 'calendar' });
            }
        });

        // Search holidays
        SCP.HOLIDAYS.forEach(h => {
            if (h.name.toLowerCase().includes(q)) {
                hits.push({ type: 'holiday', label: `${h.name} — ${h.date}`, icon: '🎉', id: h.date, panel: 'calendar' });
            }
        });

        // Search drive files
        const drive = SCP.getData('scp_drive_files', []);
        drive.forEach(f => {
            if (f.name.toLowerCase().includes(q)) {
                hits.push({ type: 'drive', label: f.name, icon: '☁️', id: f.id, url: `https://drive.google.com/file/d/${f.driveId}/view`, panel: 'files' });
            }
        });

        if (hits.length === 0) {
            results.innerHTML = `<div class="search-no-results">No results for "<strong>${query}</strong>"</div>`;
            return;
        }

        const typeLabel = { file: 'File', folder: 'Folder', task: 'Task', event: 'Event', holiday: 'Holiday', drive: 'Drive' };
        results.innerHTML = hits.slice(0, 15).map(h => `
      <div class="search-result-item" data-panel="${h.panel}" data-type="${h.type}" data-id="${h.id || ''}" data-url="${h.url || ''}">
        <span class="sr-icon">${h.icon}</span>
        <span class="sr-label">${highlight(h.label, query)}</span>
        <span class="sr-type">${typeLabel[h.type] || h.type}</span>
      </div>
    `).join('');

        // Click results
        results.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const panel = item.dataset.panel;
                const type = item.dataset.type;
                const url = item.dataset.url;
                if (url && (type === 'file' || type === 'drive')) {
                    window.open(url, '_blank');
                } else {
                    SCP.navigateTo(panel);
                }
                closeSearch();
            });
        });
    };

    const highlight = (text, query) => {
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return text;
        return text.substring(0, idx) + `<mark style="background:rgba(var(--accent-rgb),0.3);color:inherit;border-radius:2px">${text.substring(idx, idx + query.length)}</mark>` + text.substring(idx + query.length);
    };

    const closeSearch = () => {
        SCP.closeModal('search-overlay');
        input.value = '';
        results.innerHTML = '';
    };

    input.addEventListener('input', (e) => search(e.target.value));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearch();
        if (e.key === 'Enter') {
            const first = results.querySelector('.search-result-item');
            if (first) first.click();
        }
        // Arrow key navigation
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const items = results.querySelectorAll('.search-result-item');
            let idx = Array.from(items).findIndex(el => el === document.activeElement);
            if (e.key === 'ArrowDown') idx = Math.min(idx + 1, items.length - 1);
            else idx = Math.max(idx - 1, 0);
            items[idx]?.focus();
        }
    });

    // Show hint on open
    document.getElementById('search-btn')?.addEventListener('click', () => {
        results.innerHTML = '<div class="search-no-results">Start typing to search files, folders, and tasks</div>';
    });
});
