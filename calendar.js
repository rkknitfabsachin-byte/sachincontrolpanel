// =============================================
// CALENDAR.JS — Calendar Widget + Manual Holidays
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    const now = new Date();
    let calYear = now.getFullYear();
    let calMonth = now.getMonth();
    let selectedDate = null;

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // ===== HOLIDAY HELPERS =====
    SCP.getHolidays = () => SCP.getData('scp_holidays', []);
    SCP.saveHolidays = (arr) => SCP.setData('scp_holidays', arr);

    // Expose for dashboard
    Object.defineProperty(SCP, 'HOLIDAYS', {
        get: () => SCP.getHolidays(),
        configurable: true
    });

    // ===== ADD HOLIDAY =====
    document.getElementById('add-holiday-btn')?.addEventListener('click', () => {
        document.getElementById('holiday-name-input').value = '';
        document.getElementById('holiday-date-input').value = '';
        SCP.openModal('add-holiday-modal');
        setTimeout(() => document.getElementById('holiday-name-input')?.focus(), 100);
    });
    document.getElementById('cancel-add-holiday')?.addEventListener('click', () => SCP.closeModal('add-holiday-modal'));
    document.getElementById('confirm-add-holiday')?.addEventListener('click', () => {
        const name = document.getElementById('holiday-name-input')?.value.trim();
        const date = document.getElementById('holiday-date-input')?.value;
        if (!name || !date) { alert('Enter both a name and date.'); return; }
        const holidays = SCP.getHolidays();
        holidays.push({ id: SCP.genId(), name, date, createdAt: Date.now() });
        holidays.sort((a, b) => a.date.localeCompare(b.date));
        SCP.saveHolidays(holidays);
        SCP.closeModal('add-holiday-modal');
        SCP.renderCalendar();
        SCP.refreshDashboard();
    });

    // ===== DELETE HOLIDAY =====
    SCP.deleteHoliday = (id) => {
        if (!confirm('Remove this holiday?')) return;
        const holidays = SCP.getHolidays().filter(h => h.id !== id);
        SCP.saveHolidays(holidays);
        SCP.renderCalendar();
        SCP.refreshDashboard();
    };

    // ===== RENDER CALENDAR =====
    SCP.renderCalendar = () => {
        renderCalendarGrid();
        renderHolidaysList();
        renderEventsList();
    };

    const renderCalendarGrid = () => {
        const grid = document.getElementById('calendar-grid');
        const title = document.getElementById('cal-title');
        if (!grid || !title) return;
        title.textContent = `${MONTHS[calMonth]} ${calYear}`;

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const prevDays = new Date(calYear, calMonth, 0).getDate();
        const holidays = SCP.getHolidays();
        const holidayDates = new Set(holidays.map(h => h.date));
        const events = SCP.getData('scp_events', []);
        const eventDates = {};
        events.forEach(e => {
            if (!eventDates[e.date]) eventDates[e.date] = [];
            eventDates[e.date].push(e);
        });

        grid.innerHTML = '';
        // Previous month padding
        for (let i = firstDay - 1; i >= 0; i--) {
            const cell = document.createElement('div');
            cell.className = 'cal-day other-month';
            cell.innerHTML = `<span class="cal-day-number">${prevDays - i}</span>`;
            grid.appendChild(cell);
        }
        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const cellDate = new Date(calYear, calMonth, d);
            const isToday = cellDate.getTime() === today.getTime();
            const isHoliday = holidayDates.has(dateStr);
            const hasEvent = !!eventDates[dateStr];
            const cell = document.createElement('div');
            cell.className = `cal-day${isToday ? ' today' : ''}${isHoliday ? ' holiday' : ''}${hasEvent ? ' has-event' : ''}`;
            cell.innerHTML = `<span class="cal-day-number">${d}</span>`;
            if (isHoliday) {
                const h = holidays.find(x => x.date === dateStr);
                cell.title = h ? `🎉 ${h.name}` : '';
            }
            if (hasEvent) {
                const dotsEl = document.createElement('div');
                dotsEl.className = 'cal-day-dots';
                eventDates[dateStr].slice(0, 3).forEach(ev => {
                    const dot = document.createElement('div');
                    dot.className = 'cal-dot';
                    dot.style.background = ev.color || 'var(--accent)';
                    dotsEl.appendChild(dot);
                });
                cell.appendChild(dotsEl);
            }
            cell.addEventListener('click', () => {
                selectedDate = dateStr;
                const label = document.getElementById('event-date-label');
                if (label) {
                    const dobj = new Date(calYear, calMonth, d);
                    label.textContent = `${MONTHS[dobj.getMonth()]} ${dobj.getDate()}, ${dobj.getFullYear()}`;
                }
                document.getElementById('event-title-input').value = '';
                SCP.openModal('add-event-modal');
            });
            grid.appendChild(cell);
        }
        // Trailing days
        const total = firstDay + daysInMonth;
        const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
        for (let d = 1; d <= remaining; d++) {
            const cell = document.createElement('div');
            cell.className = 'cal-day other-month';
            cell.innerHTML = `<span class="cal-day-number">${d}</span>`;
            grid.appendChild(cell);
        }
    };

    // ===== HOLIDAYS LIST =====
    const renderHolidaysList = () => {
        const el = document.getElementById('cal-holidays-list');
        if (!el) return;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const holidays = SCP.getHolidays();
        if (holidays.length === 0) {
            el.innerHTML = `<p class="empty-text">No holidays added yet.<br>Click <strong>+ Add Holiday</strong> to add one.</p>`;
            return;
        }
        const upcoming = holidays.filter(h => new Date(h.date + 'T00:00:00') >= today);
        const past = holidays.filter(h => new Date(h.date + 'T00:00:00') < today);
        const toShow = upcoming.length > 0 ? upcoming : past;
        el.innerHTML = toShow.map(h => {
            const d = new Date(h.date + 'T00:00:00');
            const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
            const isPast = d < today;
            return `<div class="side-holiday-item${isPast ? ' past-holiday' : ''}">
        <span class="sh-date">${mon} ${d.getDate()}</span>
        <span class="sh-name">${h.name}</span>
        <button class="se-del" onclick="SCP.deleteHoliday('${h.id}')" title="Remove"><i class="ph-bold ph-x"></i></button>
      </div>`;
        }).join('');
    };

    // ===== EVENTS LIST =====
    const renderEventsList = () => {
        const el = document.getElementById('cal-events-list');
        if (!el) return;
        const events = SCP.getData('scp_events', []);
        if (events.length === 0) { el.innerHTML = '<p class="empty-text">No events added</p>'; return; }
        const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
        el.innerHTML = sorted.map(ev => {
            const d = new Date(ev.date + 'T00:00:00');
            const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
            return `<div class="side-event-item">
        <div class="se-dot" style="background:${ev.color || 'var(--accent)'}"></div>
        <div style="flex:1">
          <div class="se-title">${ev.title}</div>
          <div class="se-date">${mon} ${d.getDate()}, ${d.getFullYear()}</div>
        </div>
        <button class="se-del" onclick="SCP.deleteEvent('${ev.id}')" title="Delete"><i class="ph-bold ph-trash"></i></button>
      </div>`;
        }).join('');
    };

    // ===== NAV BUTTONS =====
    document.getElementById('cal-prev')?.addEventListener('click', () => {
        calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; }
        renderCalendarGrid();
    });
    document.getElementById('cal-next')?.addEventListener('click', () => {
        calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; }
        renderCalendarGrid();
    });

    // ===== ADD EVENT =====
    document.getElementById('cancel-add-event')?.addEventListener('click', () => SCP.closeModal('add-event-modal'));
    document.getElementById('confirm-add-event')?.addEventListener('click', () => {
        const title = document.getElementById('event-title-input')?.value.trim();
        if (!title || !selectedDate) { alert('Enter an event title.'); return; }
        const color = SCP.getSelectedColor('event-color-options') || '#00f5ff';
        const events = SCP.getData('scp_events', []);
        events.push({ id: SCP.genId(), date: selectedDate, title, color, createdAt: Date.now() });
        SCP.setData('scp_events', events);
        SCP.closeModal('add-event-modal');
        renderCalendarGrid();
        renderEventsList();
        SCP.refreshDashboard();
    });

    // ===== DELETE EVENT =====
    SCP.deleteEvent = (id) => {
        if (!confirm('Delete this event?')) return;
        let events = SCP.getData('scp_events', []);
        events = events.filter(e => e.id !== id);
        SCP.setData('scp_events', events);
        SCP.renderCalendar();
        SCP.refreshDashboard();
    };
});
