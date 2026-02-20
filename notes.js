// NOTES.JS — Notes & Ideas Corner
document.addEventListener('DOMContentLoaded', () => {
    let activeNoteId = null, saveTimer = null;

    SCP.renderNotes = () => {
        const notes = SCP.getData('scp_notes', []);
        const list = document.getElementById('notes-list');
        if (!list) return;
        if (notes.length === 0) {
            list.innerHTML = '<p class="empty-text" style="padding:16px">Click + New Note to start.</p>';
            showWelcome(); return;
        }
        const sorted = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);
        list.innerHTML = sorted.map(n => `
      <div class="note-item ${activeNoteId === n.id ? 'active' : ''} ${n.pinned ? 'pinned' : ''}" data-id="${n.id}" onclick="SCP.openNote('${n.id}')">
        <div class="note-item-top"><span class="note-item-title">${n.title || 'Untitled'}</span>${n.pinned ? '<i class="ph-fill ph-push-pin note-pin-icon"></i>' : ''}</div>
        <div class="note-item-preview">${(n.content || '').replace(/\n/g, ' ').substring(0, 65)}…</div>
        <div class="note-item-date">${new Date(n.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
      </div>`).join('');
        if (activeNoteId) { const note = notes.find(n => n.id === activeNoteId); if (note) populateEditor(note); else { activeNoteId = null; showWelcome(); } }
        else SCP.openNote(sorted[0].id);
    };

    SCP.openNote = (id) => {
        saveCurrentNote(); activeNoteId = id;
        const note = SCP.getData('scp_notes', []).find(n => n.id === id);
        if (!note) return;
        populateEditor(note);
        document.querySelectorAll('.note-item').forEach(el => el.classList.toggle('active', el.dataset.id === id));
    };

    const populateEditor = (note) => {
        document.getElementById('note-welcome')?.classList.add('hidden');
        document.getElementById('note-editor-area')?.classList.remove('hidden');
        const t = document.getElementById('note-editor-title'), c = document.getElementById('note-editor-content'), p = document.getElementById('note-pin-btn');
        if (t) t.value = note.title || '';
        if (c) c.value = note.content || '';
        if (p) { p.innerHTML = note.pinned ? '<i class="ph-fill ph-push-pin"></i> Unpin' : '<i class="ph-bold ph-push-pin"></i> Pin'; p.classList.toggle('active', !!note.pinned); }
        updateWC(note.content || '');
    };
    const showWelcome = () => { document.getElementById('note-editor-area')?.classList.add('hidden'); document.getElementById('note-welcome')?.classList.remove('hidden'); };
    const updateWC = (text) => { const el = document.getElementById('note-word-count'); if (!el) return; const w = text.trim() ? text.trim().split(/\s+/).length : 0; el.textContent = `${w} words · ${text.length} chars`; };

    const saveCurrentNote = () => {
        if (!activeNoteId) return;
        const title = document.getElementById('note-editor-title')?.value || '', content = document.getElementById('note-editor-content')?.value || '';
        const notes = SCP.getData('scp_notes', []); const note = notes.find(n => n.id === activeNoteId);
        if (note) { note.title = title; note.content = content; note.updatedAt = Date.now(); SCP.setData('scp_notes', notes); }
        const el = document.querySelector(`.note-item[data-id="${activeNoteId}"] .note-item-title`); if (el) el.textContent = title || 'Untitled';
    };

    document.getElementById('new-note-btn')?.addEventListener('click', () => {
        saveCurrentNote(); const notes = SCP.getData('scp_notes', []);
        const note = { id: SCP.genId(), title: '', content: '', pinned: false, createdAt: Date.now(), updatedAt: Date.now() };
        notes.unshift(note); SCP.setData('scp_notes', notes); activeNoteId = note.id; SCP.renderNotes();
        setTimeout(() => document.getElementById('note-editor-title')?.focus(), 80);
    });
    document.getElementById('delete-note-btn')?.addEventListener('click', () => {
        if (!activeNoteId || !confirm('Delete this note?')) return;
        let notes = SCP.getData('scp_notes', []).filter(n => n.id !== activeNoteId); SCP.setData('scp_notes', notes); activeNoteId = null; SCP.renderNotes();
    });
    document.getElementById('note-pin-btn')?.addEventListener('click', () => {
        if (!activeNoteId) return; const notes = SCP.getData('scp_notes', []); const note = notes.find(n => n.id === activeNoteId);
        if (note) { note.pinned = !note.pinned; SCP.setData('scp_notes', notes); } SCP.renderNotes();
    });
    document.getElementById('note-editor-title')?.addEventListener('input', () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveCurrentNote, 800); });
    document.getElementById('note-editor-content')?.addEventListener('input', (e) => { updateWC(e.target.value); clearTimeout(saveTimer); saveTimer = setTimeout(saveCurrentNote, 800); });
});
