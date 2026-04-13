/**
 * ui.js
 * ─────────────────────────────────────
 * UI helpers: toast, modal, rendering helpers.
 */

const UI = (() => {

  /* ── Toast ── */
  function toast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    el.innerHTML = `<span>${icons[type] || '•'}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  /* ── Modal ── */
  const overlay = document.getElementById('modalOverlay');
  let _currentModal = null;

  function openModal(id) {
    if (_currentModal) closeModal(_currentModal);
    const modal = document.getElementById(id);
    if (!modal) return;
    overlay.classList.add('open');
    modal.classList.add('open');
    _currentModal = id;
    // trap focus
    setTimeout(() => {
      const first = modal.querySelector('input, select, textarea, button:not(.modal-close)');
      if (first) first.focus();
    }, 100);
  }

  function closeModal(id) {
    const modal = document.getElementById(id || _currentModal);
    if (!modal) return;
    modal.classList.remove('open');
    overlay.classList.remove('open');
    _currentModal = null;
  }

  // Close on overlay click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });

  // Close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  /* ── Confirm Dialog ── */
  function confirm(title, message) {
    return new Promise(resolve => {
      document.getElementById('confirmTitle').textContent   = title;
      document.getElementById('confirmMessage').textContent = message;
      openModal('confirmModal');
      const okBtn  = document.getElementById('confirmOk');
      const canBtn = document.getElementById('confirmCancel');
      function cleanup() {
        okBtn.removeEventListener('click', onOk);
        canBtn.removeEventListener('click', onCancel);
        closeModal('confirmModal');
      }
      function onOk()     { cleanup(); resolve(true);  }
      function onCancel() { cleanup(); resolve(false); }
      okBtn.addEventListener('click', onOk);
      canBtn.addEventListener('click', onCancel);
    });
  }

  /* ── Grade pill ── */
  function gradePill(letter) {
    const cls = 'grade-' + (letter ? letter[0] : 'F');
    return `<span class="grade-pill ${cls}">${letter || 'F'}</span>`;
  }

  /* ── Colour dot ── */
  function colorDot(color) {
    return `<span class="course-dot" style="background:${color || '#E8B84B'}"></span>`;
  }

  /* ── Format date ── */
  function fmtDate(dateStr) {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return dateStr; }
  }

  /* ── Populate a <select> ── */
  function populateSelect(selectEl, items, valKey, labelKey, emptyLabel) {
    const current = selectEl.value;
    selectEl.innerHTML = emptyLabel
      ? `<option value="">${emptyLabel}</option>`
      : '';
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value       = item[valKey];
      opt.textContent = item[labelKey];
      selectEl.appendChild(opt);
    });
    if (current) selectEl.value = current;
  }

  /* ── Render course cards ── */
  function renderCourseCards(courses, grades, scale, onEdit, onDelete, onAddGrade) {
    const grid = document.getElementById('coursesGrid');
    if (!courses.length) {
      grid.innerHTML = `
        <div class="empty-state-card">
          <p class="empty-icon">◫</p>
          <p>No courses added yet. Click <strong>+ Add Course</strong> to begin.</p>
        </div>`;
      return;
    }
    grid.innerHTML = courses.map(course => {
      const cGrades = grades.filter(g => g.courseId === course.id);
      const avg     = Grading.calcAverage(cGrades);
      const { letter } = avg !== null ? Grading.percentToGrade(avg, scale) : { letter: '—' };
      const avgDisplay = avg !== null ? avg.toFixed(1) + '%' : '—';
      const letterColor = letter !== '—' ? _letterColor(letter) : 'var(--text-muted)';
      return `
        <div class="course-card" data-id="${course.id}">
          <div class="course-card-top" style="background:${course.color || '#E8B84B'}"></div>
          <div class="course-card-body">
            <div class="course-code">${course.code || '—'} · ${course.semester || ''}</div>
            <div class="course-name">${course.name}</div>
            <div class="course-meta">${course.instructor ? '👤 ' + course.instructor : ''} · ${course.credits || 3} cr</div>
            <div class="course-grade-row">
              <div>
                <div class="course-avg-label">Average</div>
                <div class="course-avg-val" style="color:${letterColor}">${avgDisplay}</div>
              </div>
              <span class="course-grade-letter" style="color:${letterColor}">${letter}</span>
            </div>
          </div>
          <div class="course-actions">
            <button class="btn btn-sm btn-primary" data-action="addgrade" data-id="${course.id}">+ Grade</button>
            <button class="btn btn-sm btn-ghost" data-action="edit" data-id="${course.id}">Edit</button>
            <button class="btn btn-sm btn-ghost tbl-btn del" data-action="delete" data-id="${course.id}">Delete</button>
          </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const { action, id } = btn.dataset;
        if (action === 'edit')     onEdit(id);
        if (action === 'delete')   onDelete(id);
        if (action === 'addgrade') onAddGrade(id);
      });
    });
  }

  /* ── Render grades table ── */
  function renderGradesTable(grades, courses, scale, onEdit, onDelete) {
    const tbody = document.getElementById('gradesTableBody');
    if (!grades.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No grades yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = grades.map(g => {
      const course = courses.find(c => c.id === g.courseId);
      const pct    = g.maxScore ? (g.score / g.maxScore) * 100 : null;
      const { letter } = pct !== null ? Grading.percentToGrade(pct, scale) : { letter: '—' };
      const dot = course ? colorDot(course.color) : '';
      const courseName = course ? course.name : '—';
      return `
        <tr data-id="${g.id}">
          <td>${dot}${courseName}</td>
          <td style="color:var(--text-primary);font-weight:600">${g.name}</td>
          <td><span style="font-size:11px;color:var(--text-muted);background:var(--bg-raised);padding:2px 8px;border-radius:100px">${g.type || '—'}</span></td>
          <td style="font-family:var(--font-mono)">${g.score}/${g.maxScore} <span style="color:var(--text-muted);font-size:11px">(${pct !== null ? pct.toFixed(1) : '—'}%)</span></td>
          <td style="font-family:var(--font-mono);color:var(--text-muted)">${g.weight != null && g.weight !== '' ? g.weight + '%' : '—'}</td>
          <td style="color:var(--text-muted)">${fmtDate(g.date)}</td>
          <td>${gradePill(letter)}</td>
          <td>
            <button class="tbl-btn" data-action="edit" data-id="${g.id}">Edit</button>
            <button class="tbl-btn del" data-action="delete" data-id="${g.id}">✕</button>
          </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const { action, id } = btn.dataset;
        if (action === 'edit')   onEdit(id);
        if (action === 'delete') onDelete(id);
      });
    });
  }

  /* ── Render recent activity ── */
  function renderRecentActivity(grades, courses, limit = 6) {
    const list = document.getElementById('recentList');
    const sorted = [...grades].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
    if (!sorted.length) {
      list.innerHTML = `<li class="empty-state">No grades recorded yet.</li>`;
      return;
    }
    list.innerHTML = sorted.map(g => {
      const course = courses.find(c => c.id === g.courseId);
      const pct    = g.maxScore ? (g.score / g.maxScore) * 100 : null;
      const { letter } = pct !== null ? Grading.percentToGrade(pct) : { letter: '—' };
      const color = course ? course.color : '#E8B84B';
      return `
        <li class="activity-item">
          <span class="course-dot" style="background:${color}"></span>
          <div class="activity-info">
            <div class="activity-name">${g.name}</div>
            <div class="activity-course">${course ? course.code || course.name : '—'}</div>
          </div>
          <span class="activity-score" style="color:${_letterColor(letter)}">${letter} · ${pct !== null ? pct.toFixed(0) + '%' : '—'}</span>
        </li>`;
    }).join('');
  }

  /* ── Analytics summary cards ── */
  function renderAnalyticsSummary(courses, grades, scale) {
    const container = document.getElementById('analyticsSummary');
    if (!courses.length) { container.innerHTML = ''; return; }

    const items = courses.map(course => {
      const cGrades = grades.filter(g => g.courseId === course.id);
      const avg     = Grading.calcAverage(cGrades);
      const { letter } = avg !== null ? Grading.percentToGrade(avg, scale) : { letter: '—' };
      const color = _letterColor(letter);
      return `
        <div class="analytics-summary-item">
          <div class="analytics-summary-label" style="color:${course.color || 'var(--gold)'}">${course.code || course.name}</div>
          <div class="analytics-summary-value" style="color:${color}">${avg !== null ? avg.toFixed(1) + '%' : '—'}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${letter} · ${course.credits || 3} cr</div>
          <div class="progress-bar-wrap" style="margin-top:8px">
            <div class="progress-bar-fill" style="width:${avg || 0}%;background:${course.color || 'var(--gold)'}"></div>
          </div>
        </div>`;
    }).join('');
    container.innerHTML = items;
  }

  /* private */
  function _letterColor(letter) {
    if (!letter || letter === '—') return 'var(--text-muted)';
    const l = letter[0];
    return { A: 'var(--green)', B: 'var(--blue)', C: 'var(--gold)', D: 'var(--orange)', F: 'var(--red)' }[l] || 'var(--text-primary)';
  }

  return {
    toast, openModal, closeModal, confirm,
    gradePill, colorDot, fmtDate,
    populateSelect,
    renderCourseCards, renderGradesTable,
    renderRecentActivity, renderAnalyticsSummary
  };
})();
