// =============================================
// FILES.JS — File/Link & Folder Management
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    // ===== RENDER FILES =====
    SCP.renderFiles = () => {
        const files = SCP.getData('scp_files', []);
        const folders = SCP.getData('scp_folders', []);

        // Render folders
        const foldersGrid = document.getElementById('folders-grid');
        const foldersLabel = document.getElementById('folders-label');
        if (foldersGrid) {
            if (folders.length === 0) {
                foldersGrid.innerHTML = '<p class="empty-text" style="grid-column:1/-1">No folders yet</p>';
            } else {
                foldersGrid.innerHTML = folders.map(folder => {
                    const count = files.filter(f => f.folderId === folder.id).length;
                    return `<div class="folder-card" data-id="${folder.id}" onclick="SCP.openFolder('${folder.id}')" oncontextmenu="SCP.showContextMenu(event,'${folder.id}','folder')">
            <button class="card-ctx-btn" onclick="event.stopPropagation();SCP.showContextMenu(event,'${folder.id}','folder')">⋮</button>
            <span class="folder-emoji">📁</span>
            <div class="folder-name">${folder.name}</div>
            <div class="folder-count">${count} file${count !== 1 ? 's' : ''}</div>
          </div>`;
                }).join('');
            }
        }

        // Render files (no folder)
        const filesGrid = document.getElementById('files-grid');
        if (filesGrid) {
            const rootFiles = files.filter(f => !f.folderId);
            if (rootFiles.length === 0) {
                filesGrid.innerHTML = '<p class="empty-text" style="grid-column:1/-1">No files added yet. Click <strong>+ Add Link</strong></p>';
            } else {
                filesGrid.innerHTML = rootFiles.map(f => renderFileCard(f)).join('');
            }
        }

        // Populate folder select in add-file modal
        const sel = document.getElementById('file-folder-select');
        if (sel) {
            sel.innerHTML = '<option value="">— No Folder —</option>' +
                folders.map(fo => `<option value="${fo.id}">${fo.name}</option>`).join('');
        }

        // Drive files
        SCP.renderDriveFiles && SCP.renderDriveFiles();
    };

    const renderFileCard = (f) => {
        const icon = SCP.getFileIcon(f.url);
        const color = f.color || 'var(--accent)';
        return `<div class="file-card" data-id="${f.id}" style="--card-accent:${color}" onclick="window.open('${f.url}','_blank')" oncontextmenu="SCP.showContextMenu(event,'${f.id}','file')">
      <button class="card-ctx-btn" onclick="event.stopPropagation();SCP.showContextMenu(event,'${f.id}','file')">⋮</button>
      <span class="file-icon">${icon}</span>
      <div class="file-label">${f.label}</div>
      <div class="file-url-preview">${(f.url || '').replace(/^https?:\/\//, '').substring(0, 30)}…</div>
    </div>`;
    };

    // ===== OPEN FOLDER =====
    SCP.openFolder = (folderId) => {
        const folders = SCP.getData('scp_folders', []);
        const files = SCP.getData('scp_files', []);
        const folder = folders.find(f => f.id === folderId);
        if (!folder) return;
        const folderFiles = files.filter(f => f.folderId === folderId);
        const title = document.getElementById('folder-view-title');
        const grid = document.getElementById('folder-view-grid');
        const empty = document.getElementById('folder-view-empty');
        if (title) title.textContent = `📂 ${folder.name}`;
        if (grid) {
            if (folderFiles.length === 0) { grid.innerHTML = ''; empty && empty.classList.remove('hidden'); }
            else { empty && empty.classList.add('hidden'); grid.innerHTML = folderFiles.map(f => renderFileCard(f)).join(''); }
        }
        SCP.openModal('folder-view-modal');
    };

    document.getElementById('close-folder-view')?.addEventListener('click', () => SCP.closeModal('folder-view-modal'));

    // ===== ADD FILE MODAL =====
    document.getElementById('add-file-btn')?.addEventListener('click', () => {
        document.getElementById('file-label-input').value = '';
        document.getElementById('file-url-input').value = '';
        SCP.openModal('add-file-modal');
    });
    document.getElementById('cancel-add-file')?.addEventListener('click', () => SCP.closeModal('add-file-modal'));
    document.getElementById('confirm-add-file')?.addEventListener('click', () => {
        const label = document.getElementById('file-label-input')?.value.trim();
        const url = document.getElementById('file-url-input')?.value.trim();
        if (!label || !url) { alert('Please fill in both label and URL.'); return; }
        const color = SCP.getSelectedColor('file-color-options') || '#00f5ff';
        const folderId = document.getElementById('file-folder-select')?.value || null;
        const files = SCP.getData('scp_files', []);
        files.push({ id: SCP.genId(), label, url, color, folderId: folderId || null, createdAt: Date.now() });
        SCP.setData('scp_files', files);
        SCP.closeModal('add-file-modal');
        SCP.renderFiles();
        SCP.refreshDashboard();
    });

    // ===== ADD FOLDER MODAL =====
    document.getElementById('add-folder-btn')?.addEventListener('click', () => {
        document.getElementById('folder-name-input').value = '';
        SCP.openModal('add-folder-modal');
    });
    document.getElementById('cancel-add-folder')?.addEventListener('click', () => SCP.closeModal('add-folder-modal'));
    document.getElementById('confirm-add-folder')?.addEventListener('click', () => {
        const name = document.getElementById('folder-name-input')?.value.trim();
        if (!name) { alert('Enter a folder name.'); return; }
        const color = SCP.getSelectedColor('folder-color-options') || '#00f5ff';
        const folders = SCP.getData('scp_folders', []);
        folders.push({ id: SCP.genId(), name, color, createdAt: Date.now() });
        SCP.setData('scp_folders', folders);
        SCP.closeModal('add-folder-modal');
        SCP.renderFiles();
        SCP.refreshDashboard();
    });

    // ===== RENAME =====
    SCP.renameItem = (id, type) => {
        SCP._renameId = id; SCP._renameType = type;
        let currentName = '';
        if (type === 'file') { const files = SCP.getData('scp_files', []); currentName = files.find(f => f.id === id)?.label || ''; }
        if (type === 'folder') { const folders = SCP.getData('scp_folders', []); currentName = folders.find(f => f.id === id)?.name || ''; }
        const inp = document.getElementById('rename-input');
        if (inp) inp.value = currentName;
        SCP.openModal('rename-modal');
        setTimeout(() => inp?.focus(), 100);
    };
    document.getElementById('cancel-rename')?.addEventListener('click', () => SCP.closeModal('rename-modal'));
    document.getElementById('confirm-rename')?.addEventListener('click', () => {
        const newName = document.getElementById('rename-input')?.value.trim();
        if (!newName) return;
        if (SCP._renameType === 'file') {
            const files = SCP.getData('scp_files', []);
            const f = files.find(x => x.id === SCP._renameId);
            if (f) { f.label = newName; SCP.setData('scp_files', files); }
        } else if (SCP._renameType === 'folder') {
            const folders = SCP.getData('scp_folders', []);
            const f = folders.find(x => x.id === SCP._renameId);
            if (f) { f.name = newName; SCP.setData('scp_folders', folders); }
        }
        SCP.closeModal('rename-modal');
        SCP.renderFiles();
    });

    // ===== DELETE =====
    SCP.deleteItem = (id, type) => {
        const label = type === 'file' ? 'file' : 'folder';
        if (!confirm(`Delete this ${label}?`)) return;
        if (type === 'file') {
            let files = SCP.getData('scp_files', []);
            files = files.filter(f => f.id !== id);
            SCP.setData('scp_files', files);
        } else {
            let folders = SCP.getData('scp_folders', []);
            folders = folders.filter(f => f.id !== id);
            SCP.setData('scp_folders', folders);
            // Unlink files from this folder
            let files = SCP.getData('scp_files', []);
            files = files.map(f => f.folderId === id ? { ...f, folderId: null } : f);
            SCP.setData('scp_files', files);
        }
        SCP.renderFiles();
        SCP.refreshDashboard();
    };

    // ===== MOVE TO FOLDER =====
    SCP.showMoveModal = (fileId) => {
        SCP._moveFileId = fileId;
        const folders = SCP.getData('scp_folders', []);
        const list = document.getElementById('move-folder-list');
        if (!list) return;
        list.innerHTML = '<div class="move-folder-opt" data-id="">📭 No Folder (Root)</div>' +
            folders.map(f => `<div class="move-folder-opt" data-id="${f.id}">📁 ${f.name}</div>`).join('');
        list.querySelectorAll('.move-folder-opt').forEach(opt => {
            opt.addEventListener('click', () => {
                const files = SCP.getData('scp_files', []);
                const f = files.find(x => x.id === SCP._moveFileId);
                if (f) { f.folderId = opt.dataset.id || null; SCP.setData('scp_files', files); }
                SCP.closeModal('move-modal');
                SCP.renderFiles();
            });
        });
        SCP.openModal('move-modal');
    };
    document.getElementById('cancel-move')?.addEventListener('click', () => SCP.closeModal('move-modal'));

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && overlay.id !== 'profile-setup-modal') {
                overlay.classList.add('hidden');
            }
        });
    });
});
