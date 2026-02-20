// CALCULATOR.JS — Calculator with Saved Calculations
document.addEventListener('DOMContentLoaded', () => {
    let display = '', result = '';

    const updateDisplay = () => {
        const d = document.getElementById('calc-display'), s = document.getElementById('calc-subdisplay');
        if (d) d.textContent = display || '0';
        if (s) s.textContent = result;
    };

    const renderSaved = () => {
        const list = document.getElementById('saved-calcs-list'); if (!list) return;
        const calcs = SCP.getData('scp_calculations', []);
        list.innerHTML = calcs.length === 0
            ? '<p class="empty-text">No saved calculations yet.</p>'
            : calcs.map(c => `
        <div class="saved-calc-item">
          <div class="sc-name">${c.name}</div>
          <div class="sc-expr">${c.expression} = <strong>${c.result}</strong></div>
          <div class="sc-actions">
            <button onclick="SCP.loadCalc('${c.id}')" title="Load"><i class="ph-bold ph-arrow-u-up-left"></i></button>
            <button class="danger" onclick="SCP.deleteCalc('${c.id}')" title="Delete"><i class="ph-bold ph-trash"></i></button>
          </div>
        </div>`).join('');
    };

    SCP.initCalculator = () => { updateDisplay(); renderSaved(); };

    SCP.deleteCalc = (id) => {
        let c = SCP.getData('scp_calculations', []).filter(x => x.id !== id);
        SCP.setData('scp_calculations', c); renderSaved();
    };

    SCP.loadCalc = (id) => {
        const c = SCP.getData('scp_calculations', []).find(x => x.id === id);
        if (c) { display = c.result; result = `${c.expression} = ${c.result}`; updateDisplay(); }
    };

    const safeEval = (expr) => {
        const safe = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, String(Math.PI)).replace(/√\(/g, 'Math.sqrt(').replace(/√(\d+(\.\d+)?)/g, (m, n) => `Math.sqrt(${n})`);
        return Function('"use strict"; return (' + safe + ')')();
    };

    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action, val = btn.dataset.val;
            if (val !== undefined) {
                display += val; result = ''; updateDisplay();
            } else if (action === 'clear') {
                display = ''; result = ''; updateDisplay();
            } else if (action === 'backspace') {
                display = display.slice(0, -1); updateDisplay();
            } else if (action === 'equals') {
                try {
                    const r = safeEval(display);
                    const formatted = parseFloat(r.toFixed(10));
                    result = display; display = String(formatted); updateDisplay();
                } catch { display = 'Error'; updateDisplay(); setTimeout(() => { display = ''; updateDisplay(); }, 1300); }
            } else if (action === 'percent') {
                try { display = String(parseFloat(safeEval(display)) / 100); updateDisplay(); } catch { }
            } else if (action === 'negate') {
                try { display = String(-parseFloat(safeEval(display))); updateDisplay(); } catch { }
            } else if (action === 'sqrt') {
                try { display = String(Math.sqrt(parseFloat(safeEval(display)))); updateDisplay(); } catch { }
            } else if (action === 'save') {
                if (!display || display === 'Error') { alert('Nothing to save.'); return; }
                const name = prompt('Name this calculation:', result || display); if (!name) return;
                const calcs = SCP.getData('scp_calculations', []);
                calcs.unshift({ id: SCP.genId(), name, expression: result || display, result: display, createdAt: Date.now() });
                SCP.setData('scp_calculations', calcs); renderSaved();
            }
        });
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (document.querySelector('#panel-calculator.active') === null) return;
        const map = { '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '+': '+', '-': '-', '*': '×', '/': '÷', '.': '.', '(': '(', ')': ')' };
        if (map[e.key]) { display += map[e.key]; updateDisplay(); }
        else if (e.key === 'Enter' || e.key === '=') { document.querySelector('.calc-btn[data-action="equals"]')?.click(); }
        else if (e.key === 'Backspace') { display = display.slice(0, -1); updateDisplay(); }
        else if (e.key === 'Escape') { display = ''; result = ''; updateDisplay(); }
    });
});
