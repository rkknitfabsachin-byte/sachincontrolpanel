// =============================================
// PROFILE.JS — Profile Creation & Management
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    // ===== SETUP MODAL AVATAR =====
    const setupAvatarInput = document.getElementById('setup-avatar-input');
    const setupAvatarPreview = document.getElementById('setup-avatar-preview');
    let setupAvatarData = null;

    setupAvatarInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setupAvatarData = ev.target.result;
            setupAvatarPreview.innerHTML = `<img src="${setupAvatarData}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        };
        reader.readAsDataURL(file);
    });

    // Update preview initial on name change
    document.getElementById('setup-name')?.addEventListener('input', (e) => {
        if (!setupAvatarData) {
            setupAvatarPreview.textContent = (e.target.value || 'S')[0].toUpperCase();
        }
    });

    // ===== SETUP SUBMIT =====
    document.getElementById('setup-submit-btn')?.addEventListener('click', () => {
        const name = document.getElementById('setup-name')?.value.trim() || 'Sachin';
        const tagline = document.getElementById('setup-tagline')?.value.trim() || '';
        const accent = SCP.getSelectedColor('setup-color-options') || 'cyan';

        const profile = { name, tagline, avatar: setupAvatarData, accent, theme: 'dark' };
        SCP.setData('scp_profile', profile);
        SCP.closeModal('profile-setup-modal');
        SCP.updateSidebarProfile(profile);
        SCP.refreshDashboard && SCP.refreshDashboard();
    });

    // ===== PROFILE PANEL RENDER =====
    SCP.renderProfile = () => {
        const profile = SCP.getData('scp_profile', {});
        const nameEl = document.getElementById('profile-name-input');
        const tagEl = document.getElementById('profile-tagline-input');
        const avatarEl = document.getElementById('profile-avatar-display');

        if (nameEl) nameEl.value = profile.name || '';
        if (tagEl) tagEl.value = profile.tagline || '';
        if (avatarEl) {
            if (profile.avatar) avatarEl.innerHTML = `<img src="${profile.avatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            else avatarEl.textContent = (profile.name || 'S')[0].toUpperCase();
        }
        SCP.setActiveColor('profile-color-options', profile.accent || 'cyan');

        // Stats
        const files = SCP.getData('scp_files', []);
        const folders = SCP.getData('scp_folders', []);
        const tasks = SCP.getData('scp_tasks', []);
        const events = SCP.getData('scp_events', []);
        const drive = SCP.getData('scp_drive_files', []);

        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        set('ps-files', files.length);
        set('ps-folders', folders.length);
        set('ps-tasks-done', tasks.filter(t => t.completed).length);
        set('ps-events', events.length);
        set('ps-drive', drive.length);
    };

    // ===== PROFILE AVATAR EDIT =====
    let profileAvatarData = null;
    document.getElementById('profile-avatar-input')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            profileAvatarData = ev.target.result;
            const el = document.getElementById('profile-avatar-display');
            if (el) el.innerHTML = `<img src="${profileAvatarData}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        };
        reader.readAsDataURL(file);
    });

    // ===== SAVE PROFILE =====
    document.getElementById('save-profile-btn')?.addEventListener('click', () => {
        const profile = SCP.getData('scp_profile', {});
        profile.name = document.getElementById('profile-name-input')?.value.trim() || profile.name;
        profile.tagline = document.getElementById('profile-tagline-input')?.value.trim() || profile.tagline;
        profile.accent = SCP.getSelectedColor('profile-color-options') || profile.accent;
        if (profileAvatarData) profile.avatar = profileAvatarData;
        SCP.setData('scp_profile', profile);
        SCP.updateSidebarProfile(profile);
        profileAvatarData = null;

        // Flash success
        const btn = document.getElementById('save-profile-btn');
        const orig = btn.textContent;
        btn.textContent = '✅ Saved!';
        setTimeout(() => { btn.textContent = orig; }, 2000);
    });
});
