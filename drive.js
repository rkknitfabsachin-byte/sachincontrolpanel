// =============================================
// MEDIA.JS — Local Media Gallery (IndexedDB)
// No cloud, no auth — stores files on your device
// =============================================

const MEDIA_DB_NAME = 'SCP_MediaDB';
const MEDIA_STORE = 'files';

// ===== IndexedDB Helpers =====
const openMediaDB = () => new Promise((res, rej) => {
    const req = indexedDB.open(MEDIA_DB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
    req.onsuccess = e => res(e.target.result);
    req.onerror = () => rej(req.error);
});

const dbSaveMedia = async (record) => {
    const db = await openMediaDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(MEDIA_STORE, 'readwrite');
        tx.objectStore(MEDIA_STORE).add(record);
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
    });
};

const dbGetAllMedia = async () => {
    const db = await openMediaDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(MEDIA_STORE, 'readonly');
        const req = tx.objectStore(MEDIA_STORE).getAll();
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
    });
};

const dbDeleteMedia = async (id) => {
    const db = await openMediaDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(MEDIA_STORE, 'readwrite');
        tx.objectStore(MEDIA_STORE).delete(id);
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
    });
};

// ===== Blob URL cache (prevent memory leaks) =====
const _blobUrls = {};
const getBlobUrl = (id, buf, type) => {
    if (_blobUrls[id]) return _blobUrls[id];
    const url = URL.createObjectURL(new Blob([buf], { type }));
    _blobUrls[id] = url;
    return url;
};

// ===== Image thumbnail using Canvas =====
const generateImageThumb = (file) => new Promise((res) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 200;
        const ratio = Math.min(MAX / img.width, MAX / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        res(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => { URL.revokeObjectURL(url); res(null); };
    img.src = url;
});

// ===== Video thumbnail =====
const generateVideoThumb = (file) => new Promise((res) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.onloadeddata = () => {
        video.currentTime = 1;
    };
    video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200; canvas.height = 120;
        canvas.getContext('2d').drawImage(video, 0, 0, 200, 120);
        URL.revokeObjectURL(url);
        res(canvas.toDataURL('image/jpeg', 0.7));
    };
    video.onerror = () => { URL.revokeObjectURL(url); res(null); };
    video.src = url;
    video.muted = true;
    video.playsInline = true;
});

// ===== Render media grid =====
SCP.renderDriveFiles = async () => {
    const grid = document.getElementById('drive-files-grid');
    const label = document.getElementById('drive-files-label');
    if (!grid) return;
    try {
        const records = await dbGetAllMedia();
        if (records.length === 0) {
            grid.innerHTML = '<p class="empty-text media-empty-text">No media files yet — drop files above to add them</p>';
            if (label) label.style.display = 'none';
            return;
        }
        if (label) label.style.display = 'block';
        grid.innerHTML = '';
        records.sort((a, b) => b.createdAt - a.createdAt).forEach(rec => {
            const card = document.createElement('div');
            card.className = 'media-card';
            const isImage = rec.type.startsWith('image/');
            const isVideo = rec.type.startsWith('video/');
            const isAudio = rec.type.startsWith('audio/');
            const isPDF = rec.type.includes('pdf');
            let thumbHtml;
            if (rec.thumb) {
                thumbHtml = `<img src="${rec.thumb}" class="media-thumb" alt="${rec.name}">`;
            } else if (isVideo) {
                thumbHtml = `<div class="media-thumb media-thumb-icon"><i class="ph-duotone ph-film-strip"></i></div>`;
            } else if (isAudio) {
                thumbHtml = `<div class="media-thumb media-thumb-icon"><i class="ph-duotone ph-music-note"></i></div>`;
            } else if (isPDF) {
                thumbHtml = `<div class="media-thumb media-thumb-icon"><i class="ph-duotone ph-file-pdf"></i></div>`;
            } else {
                thumbHtml = `<div class="media-thumb media-thumb-icon"><i class="ph-duotone ph-file"></i></div>`;
            }
            const sizeStr = rec.size > 1024 * 1024
                ? `${(rec.size / 1024 / 1024).toFixed(1)} MB`
                : `${(rec.size / 1024).toFixed(0)} KB`;
            card.innerHTML = `
        <div class="media-thumb-wrap" data-id="${rec.id}">${thumbHtml}
          <div class="media-overlay">
            <i class="ph-bold ph-arrow-square-out"></i>
          </div>
        </div>
        <div class="media-info">
          <div class="media-name" title="${rec.name}">${rec.name}</div>
          <div class="media-meta">
            <span class="media-size">${sizeStr}</span>
            <button class="media-del" onclick="SCP.deleteMediaFile('${rec.id}')"><i class="ph-bold ph-trash"></i></button>
          </div>
        </div>`;
            // Click to open
            card.querySelector('.media-thumb-wrap').addEventListener('click', () => {
                const url = getBlobUrl(rec.id, rec.data, rec.type);
                if (isImage || isPDF) { window.open(url, '_blank'); }
                else if (isVideo || isAudio) { SCP.openMediaPlayer(url, rec.type, rec.name); }
                else { window.open(url, '_blank'); }
            });
            grid.appendChild(card);
        });
    } catch (e) {
        grid.innerHTML = '<p class="empty-text">Error loading media</p>';
        console.error(e);
    }
};

// ===== Media Player Lightbox =====
SCP.openMediaPlayer = (url, type, name) => {
    let el = document.getElementById('media-lightbox');
    if (!el) {
        el = document.createElement('div');
        el.id = 'media-lightbox'; el.className = 'media-lightbox';
        el.innerHTML = `<div class="media-lightbox-inner">
      <div class="media-lightbox-header">
        <span id="media-lb-title"></span>
        <button onclick="SCP.closeMediaPlayer()"><i class="ph-bold ph-x"></i></button>
      </div>
      <div id="media-lb-content"></div>
    </div>`;
        el.addEventListener('click', e => { if (e.target === el) SCP.closeMediaPlayer(); });
        document.body.appendChild(el);
    }
    document.getElementById('media-lb-title').textContent = name;
    const content = document.getElementById('media-lb-content');
    if (type.startsWith('video/')) {
        content.innerHTML = `<video src="${url}" controls autoplay class="media-lb-video"></video>`;
    } else if (type.startsWith('audio/')) {
        content.innerHTML = `<div class="media-lb-audio-wrap"><i class="ph-duotone ph-music-notes"></i><audio src="${url}" controls class="media-lb-audio"></audio></div>`;
    }
    el.classList.remove('hidden');
};
SCP.closeMediaPlayer = () => {
    const el = document.getElementById('media-lightbox');
    if (el) {
        el.classList.add('hidden');
        const content = document.getElementById('media-lb-content');
        if (content) content.innerHTML = '';
    }
};

// ===== Delete =====
SCP.deleteMediaFile = async (id) => {
    if (!confirm('Delete this file from your device?')) return;
    if (_blobUrls[id]) { URL.revokeObjectURL(_blobUrls[id]); delete _blobUrls[id]; }
    await dbDeleteMedia(id);
    SCP.renderDriveFiles();
    SCP.refreshDashboard();
};

// ===== Upload handler =====
const handleMediaUpload = async (files) => {
    const progressWrap = document.getElementById('upload-progress');
    const dropAreaEl = document.getElementById('upload-drop-area');
    const fill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    if (progressWrap) progressWrap.classList.remove('hidden');
    if (dropAreaEl) dropAreaEl.style.opacity = '0.4';

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (progressText) progressText.textContent = `Processing ${file.name} (${i + 1}/${files.length})…`;
        if (fill) fill.style.width = `${((i + 0.5) / files.length) * 100}%`;
        try {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            let thumb = null;
            if (isImage) thumb = await generateImageThumb(file);
            else if (isVideo) thumb = await generateVideoThumb(file);
            const buf = await file.arrayBuffer();
            await dbSaveMedia({ id: SCP.genId(), name: file.name, type: file.type, size: file.size, data: buf, thumb, createdAt: Date.now() });
            if (fill) fill.style.width = `${((i + 1) / files.length) * 100}%`;
        } catch (err) {
            console.error('Media save error:', err);
        }
    }
    setTimeout(() => {
        if (progressWrap) progressWrap.classList.add('hidden');
        if (dropAreaEl) dropAreaEl.style.opacity = '1';
        if (fill) fill.style.width = '0';
        if (progressText) progressText.textContent = 'Processing…';
        SCP.renderDriveFiles();
        SCP.refreshDashboard();
    }, 600);
};

// ===== Init Drop Zone =====
document.addEventListener('DOMContentLoaded', () => {
    const driveZone = document.getElementById('drive-upload-zone');
    const dropArea = document.getElementById('upload-drop-area');

    ['dragenter', 'dragover'].forEach(ev => driveZone?.addEventListener(ev, (e) => {
        e.preventDefault(); driveZone.classList.add('drag-over');
    }));
    ['dragleave', 'drop'].forEach(ev => driveZone?.addEventListener(ev, (e) => {
        e.preventDefault(); driveZone.classList.remove('drag-over');
    }));
    driveZone?.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length) handleMediaUpload(files);
    });

    // Click to pick files
    dropArea?.addEventListener('click', () => {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.multiple = true;
        inp.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
        inp.onchange = () => { if (inp.files.length) handleMediaUpload(Array.from(inp.files)); };
        inp.click();
    });

    // Remove configure drive button (not needed)
    document.getElementById('configure-drive-btn')?.remove();

    SCP.renderDriveFiles();
});
