/**
 * app.js
 * ─────────────────────────────────────
 * Main application controller.
 * Wires together Storage, Grading, Charts, and UI.
 */

const App = (() => {

  /* ── State ── */
  let _currentView    = 'dashboard';
  let _editCourseId   = null;
  let _editGradeId    = null;
  let _selectedColor  = '#E8B84B';
  let _prefillCourse  = null;    // for "+ Grade" on course card

  /* ── Init ── */
  function init() {
    _bindNav();
    _bindSidebar();
    _bindPrimaryAction();
    _bindCourseModal();
    _bindGradeModal();
    _bindSettings();
    _bindExport();
    _bindFilters();
    _bindColorPicker();

    _refreshAll();
    _setDefaultDate();
  }

  /* ── Navigation ── */
  function _bindNav() {
    document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
      btn.addEventListener('click', () => _switchView(btn.dataset.view));
    });
  }

  function _switchView(view) {
    _currentView = view;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');

    const meta = {
      dashboard: ['Dashboard',  'Overview of your academic performance'],
      courses:   ['Courses',    'Manage your enrolled courses'],
      grades:    ['Grades',     'All recorded assessments'],
      analytics: ['Analytics',  'Detailed performance insights']
    };
    const [title, sub] = meta[view] || [view, ''];
    document.getElementById('pageTitle').textContent    = title;
    document.getElementById('pageSubtitle').textContent = sub;

    // Primary action button label
    const labels = { dashboard: '+ Add Course', courses: '+ Add Course', grades: '+ Add Grade', analytics: '+ Add Course' };
    document.getElementById('primaryActionBtn').textContent = labels[view] || '+ Add';

    _renderCurrentView();
  }

  /* ── Sidebar toggle ── */
  function _bindSidebar() {
    document.getElementById('sidebarToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
      setTimeout(_redrawCharts, 300);
    });
    document.getElementById('settingsBtn').addEventListener('click', () => {
      const s = Storage.getSettings();
      document.getElementById('settingName').value        = s.name || '';
      document.getElementById('settingID').value          = s.studentID || '';
      document.getElementById('settingInstitution').value = s.institution || '';
      document.getElementById('settingScale').value       = s.scale || '4.0';
      UI.openModal('settingsModal');
    });
  }

  /* ── Primary Action ── */
  function _bindPrimaryAction() {
    document.getElementById('primaryActionBtn').addEventListener('click', () => {
      if (_currentView === 'grades') _openAddGradeModal();
      else _openAddCourseModal();
    });
  }

  /* ── Course Modal ── */
  function _bindCourseModal() {
    document.getElementById('saveCourseBtn').addEventListener('click', _saveCourse);
  }

  function _openAddCourseModal(courseId = null) {
    _editCourseId  = courseId;
    _selectedColor = '#E8B84B';
    const isEdit   = !!courseId;

    document.getElementById('courseModalTitle').textContent = isEdit ? 'Edit Course' : 'Add Course';
    document.getElementById('saveCourseBtn').textContent    = isEdit ? 'Save Changes' : 'Save Course';

    if (isEdit) {
      const c = Storage.getCourse(courseId);
      document.getElementById('courseName').value        = c.name || '';
      document.getElementById('courseCode').value        = c.code || '';
      document.getElementById('courseCredits').value     = c.credits || 3;
      document.getElementById('courseSemester').value    = c.semester || '';
      document.getElementById('courseInstructor').value  = c.instructor || '';
      document.getElementById('courseGradingScale').value = c.scale || '4.0';
      _selectedColor = c.color || '#E8B84B';
    } else {
      document.getElementById('courseName').value        = '';
      document.getElementById('courseCode').value        = '';
      document.getElementById('courseCredits').value     = 3;
      document.getElementById('courseSemester').value    = '';
      document.getElementById('courseInstructor').value  = '';
      document.getElementById('courseGradingScale').value = '4.0';
    }

    document.querySelectorAll('.color-swatch').forEach(s => {
      s.classList.toggle('selected', s.dataset.color === _selectedColor);
    });

    UI.openModal('courseModal');
  }

  function _saveCourse() {
    const name     = document.getElementById('courseName').value.trim();
    const code     = document.getElementById('courseCode').value.trim();
    const credits  = parseFloat(document.getElementById('courseCredits').value) || 3;
    const semester = document.getElementById('courseSemester').value.trim();
    const instructor = document.getElementById('courseInstructor').value.trim();
    const scale    = document.getElementById('courseGradingScale').value;

    if (!name || !code || !semester) {
      UI.toast('Please fill in all required fields.', 'error'); return;
    }

    const data = { name, code, credits, semester, instructor, scale, color: _selectedColor };

    if (_editCourseId) {
      Storage.updateCourse(_editCourseId, data);
      UI.toast('Course updated.', 'success');
    } else {
      Storage.addCourse(data);
      UI.toast('Course added!', 'success');
    }

    UI.closeModal('courseModal');
    _editCourseId = null;
    _refreshAll();
  }

  /* ── Grade Modal ── */
  function _bindGradeModal() {
    document.getElementById('saveGradeBtn').addEventListener('click', _saveGrade);
  }

  function _openAddGradeModal(prefillCourseId = null, gradeId = null) {
    _editGradeId   = gradeId;
    _prefillCourse = prefillCourseId;
    const isEdit   = !!gradeId;

    document.getElementById('gradeModalTitle').textContent = isEdit ? 'Edit Grade' : 'Add Grade';
    document.getElementById('saveGradeBtn').textContent    = isEdit ? 'Save Changes' : 'Save Grade';

    _populateCourseFilter('gradeCourse', '— Select Course —');

    if (isEdit) {
      const grade = Storage.getGrades().find(g => g.id === gradeId);
      document.getElementById('gradeCourse').value  = grade.courseId || '';
      document.getElementById('gradeName').value    = grade.name || '';
      document.getElementById('gradeType').value    = grade.type || 'Assignment';
      document.getElementById('gradeDate').value    = grade.date || '';
      document.getElementById('gradeScore').value   = grade.score ?? '';
      document.getElementById('gradeMax').value     = grade.maxScore ?? 100;
      document.getElementById('gradeWeight').value  = grade.weight ?? '';
      document.getElementById('gradeNotes').value   = grade.notes || '';
    } else {
      document.getElementById('gradeCourse').value  = prefillCourseId || '';
      document.getElementById('gradeName').value    = '';
      document.getElementById('gradeType').value    = 'Assignment';
      document.getElementById('gradeScore').value   = '';
      document.getElementById('gradeMax').value     = 100;
      document.getElementById('gradeWeight').value  = '';
      document.getElementById('gradeNotes').value   = '';
      _setDefaultDate();
    }

    UI.openModal('gradeModal');
  }

  function _saveGrade() {
    const courseId = document.getElementById('gradeCourse').value;
    const name     = document.getElementById('gradeName').value.trim();
    const type     = document.getElementById('gradeType').value;
    const date     = document.getElementById('gradeDate').value;
    const score    = parseFloat(document.getElementById('gradeScore').value);
    const maxScore = parseFloat(document.getElementById('gradeMax').value) || 100;
    const weight   = document.getElementById('gradeWeight').value.trim();
    const notes    = document.getElementById('gradeNotes').value.trim();

    if (!courseId || !name || isNaN(score)) {
      UI.toast('Please fill in all required fields.', 'error'); return;
    }
    if (score < 0 || score > maxScore * 2) {
      UI.toast('Score seems invalid. Check your values.', 'error'); return;
    }

    const data = {
      courseId, name, type, date, score,
      maxScore,
      weight: weight !== '' ? parseFloat(weight) : null,
      notes
    };

    if (_editGradeId) {
      Storage.updateGrade(_editGradeId, data);
      UI.toast('Grade updated.', 'success');
    } else {
      Storage.addGrade(data);
      UI.toast('Grade added!', 'success');
    }

    UI.closeModal('gradeModal');
    _editGradeId   = null;
    _prefillCourse = null;
    _refreshAll();
  }

  /* ── Settings ── */
  function _bindSettings() {
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      Storage.saveSettings({
        name:        document.getElementById('settingName').value.trim() || 'Student',
        studentID:   document.getElementById('settingID').value.trim(),
        institution: document.getElementById('settingInstitution').value.trim(),
        scale:       document.getElementById('settingScale').value
      });
      UI.closeModal('settingsModal');
      _refreshAll();
      UI.toast('Settings saved.', 'success');
    });

    document.getElementById('clearDataBtn').addEventListener('click', async () => {
      const ok = await UI.confirm('Clear All Data', 'This will permanently delete ALL courses and grades. Are you sure?');
      if (!ok) return;
      Storage.clearAll();
      UI.closeModal('settingsModal');
      _refreshAll();
      UI.toast('All data cleared.', 'info');
    });
  }

  /* ── Export CSV ── */
  function _bindExport() {
    document.getElementById('exportBtn').addEventListener('click', _exportCSV);
  }

  function _exportCSV() {
    const courses = Storage.getCourses();
    const grades  = Storage.getGrades();
    const settings = Storage.getSettings();

    const rows = [
      ['Student', settings.name],
      ['Institution', settings.institution],
      ['Exported', new Date().toLocaleDateString()],
      [],
      ['Course', 'Code', 'Credits', 'Semester', 'Assessment', 'Type', 'Score', 'Max', 'Percentage', 'Weight', 'Grade Letter', 'Date', 'Notes']
    ];

    grades.forEach(g => {
      const course = courses.find(c => c.id === g.courseId);
      const pct    = g.maxScore ? ((g.score / g.maxScore) * 100).toFixed(2) : '';
      const { letter } = pct !== '' ? Grading.percentToGrade(parseFloat(pct), settings.scale) : { letter: '' };
      rows.push([
        course?.name || '',
        course?.code || '',
        course?.credits || '',
        course?.semester || '',
        g.name,
        g.type || '',
        g.score,
        g.maxScore,
        pct,
        g.weight ?? '',
        letter,
        g.date || '',
        g.notes || ''
      ]);
    });

    const csv     = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob    = new Blob([csv], { type: 'text/csv' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href        = url;
    a.download    = `grades_${settings.name.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('Exported as CSV.', 'success');
  }

  /* ── Filters ── */
  function _bindFilters() {
    document.getElementById('courseSearch').addEventListener('input', _renderCoursesView);
    document.getElementById('semesterFilter').addEventListener('change', _renderCoursesView);
    document.getElementById('courseFilter').addEventListener('change', _renderGradesView);
    document.getElementById('typeFilter').addEventListener('change', _renderGradesView);
    document.getElementById('sortGrades').addEventListener('change', _renderGradesView);
  }

  /* ── Color picker ── */
  function _bindColorPicker() {
    document.getElementById('colorPicker').addEventListener('click', e => {
      const swatch = e.target.closest('.color-swatch');
      if (!swatch) return;
      _selectedColor = swatch.dataset.color;
      document.querySelectorAll('.color-swatch').forEach(s =>
        s.classList.toggle('selected', s === swatch));
    });
  }

  /* ── Main render ── */
  function _refreshAll() {
    const settings = Storage.getSettings();
    const name     = settings.name || 'Student';
    document.getElementById('studentNameDisplay').textContent = name;
    document.getElementById('studentAvatar').textContent      = name[0]?.toUpperCase() || 'S';

    const courses = Storage.getCourses();
    const grades  = Storage.getGrades();
    const scale   = settings.scale || '4.0';
    const { gpa } = Grading.calcGPA(courses, grades, scale);

    document.getElementById('studentGPADisplay').textContent = 'GPA: ' + Grading.fmtGPA(gpa);

    _renderCurrentView();
  }

  function _renderCurrentView() {
    switch (_currentView) {
      case 'dashboard': _renderDashboard(); break;
      case 'courses':   _renderCoursesView(); break;
      case 'grades':    _renderGradesView(); break;
      case 'analytics': _renderAnalytics(); break;
    }
  }

  /* ── Dashboard ── */
  function _renderDashboard() {
    const settings = Storage.getSettings();
    const courses  = Storage.getCourses();
    const grades   = Storage.getGrades();
    const scale    = settings.scale || '4.0';

    const { gpa, totalCredits } = Grading.calcGPA(courses, grades, scale);
    document.getElementById('stat-gpa').textContent       = Grading.fmtGPA(gpa);
    document.getElementById('stat-credits').textContent   = totalCredits;
    document.getElementById('stat-courses').textContent   = courses.length;
    document.getElementById('stat-gpa-note').textContent  = scale + ' Scale';

    // Lowest course
    let lowest = null, lowestName = '—';
    courses.forEach(c => {
      const cGrades = grades.filter(g => g.courseId === c.id);
      const avg     = Grading.calcAverage(cGrades);
      if (avg !== null && (lowest === null || avg < lowest)) {
        lowest = avg; lowestName = c.code || c.name;
      }
    });
    document.getElementById('stat-lowest').textContent      = lowestName;
    document.getElementById('stat-lowest-note').textContent = lowest !== null ? lowest.toFixed(1) + '%' : 'No data';

    // Grade distribution donut
    const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    grades.forEach(g => {
      const pct = g.maxScore ? (g.score / g.maxScore) * 100 : null;
      if (pct === null) return;
      const { letter } = Grading.percentToGrade(pct, scale);
      dist[letter[0]] = (dist[letter[0]] || 0) + 1;
    });
    const distSegs = [
      { label: 'A', value: dist.A, color: 'var(--green)' },
      { label: 'B', value: dist.B, color: 'var(--blue)' },
      { label: 'C', value: dist.C, color: 'var(--gold)' },
      { label: 'D', value: dist.D, color: 'var(--orange)' },
      { label: 'F', value: dist.F, color: 'var(--red)' },
    ].filter(s => s.value > 0);

    const totalGrades = grades.length;
    Charts.drawDonut(
      document.getElementById('distChart'),
      distSegs,
      { centerText: totalGrades, centerSub: 'total', legend: true }
    );

    // GPA timeline
    const semGPAs = Grading.calcSemesterGPAs(courses, grades, scale);
    if (semGPAs.length) {
      Charts.drawLine(
        document.getElementById('timelineChart'),
        [{ data: semGPAs.map(s => s.gpa), color: 'var(--gold)' }],
        { labels: semGPAs.map(s => s.semester), maxY: parseFloat(scale) }
      );
    } else {
      Charts.drawEmpty(document.getElementById('timelineChart'), 'Add courses across semesters to see GPA trend');
    }

    UI.renderRecentActivity(grades, courses);
  }

  /* ── Courses view ── */
  function _renderCoursesView() {
    const settings = Storage.getSettings();
    const scale    = settings.scale || '4.0';
    let courses    = Storage.getCourses();
    const grades   = Storage.getGrades();

    // Populate semester filter
    const semesters = [...new Set(courses.map(c => c.semester).filter(Boolean))];
    UI.populateSelect(document.getElementById('semesterFilter'), semesters.map(s => ({ v: s, l: s })), 'v', 'l', 'All Semesters');

    const semFilter    = document.getElementById('semesterFilter').value;
    const searchQuery  = document.getElementById('courseSearch').value.trim().toLowerCase();

    if (semFilter)    courses = courses.filter(c => c.semester === semFilter);
    if (searchQuery)  courses = courses.filter(c =>
      c.name.toLowerCase().includes(searchQuery) ||
      (c.code || '').toLowerCase().includes(searchQuery)
    );

    UI.renderCourseCards(
      courses, grades, scale,
      (id) => _openAddCourseModal(id),
      async (id) => {
        const c = Storage.getCourse(id);
        const ok = await UI.confirm('Delete Course', `Delete "${c?.name}"? All its grades will also be deleted.`);
        if (!ok) return;
        Storage.deleteCourse(id);
        _refreshAll();
        UI.toast('Course deleted.', 'info');
      },
      (id) => _openAddGradeModal(id)
    );
  }

  /* ── Grades view ── */
  function _renderGradesView() {
    const settings = Storage.getSettings();
    const scale    = settings.scale || '4.0';
    const courses  = Storage.getCourses();
    let grades     = Storage.getGrades();

    _populateCourseFilter('courseFilter', 'All Courses');

    const courseFilter = document.getElementById('courseFilter').value;
    const typeFilter   = document.getElementById('typeFilter').value;
    const sort         = document.getElementById('sortGrades').value;

    if (courseFilter) grades = grades.filter(g => g.courseId === courseFilter);
    if (typeFilter)   grades = grades.filter(g => g.type === typeFilter);

    grades.sort((a, b) => {
      if (sort === 'date-desc')  return b.createdAt - a.createdAt;
      if (sort === 'date-asc')   return a.createdAt - b.createdAt;
      const pa = a.maxScore ? (a.score / a.maxScore) : 0;
      const pb = b.maxScore ? (b.score / b.maxScore) : 0;
      if (sort === 'score-desc') return pb - pa;
      if (sort === 'score-asc')  return pa - pb;
      return 0;
    });

    UI.renderGradesTable(
      grades, courses, scale,
      (id) => _openAddGradeModal(null, id),
      async (id) => {
        const ok = await UI.confirm('Delete Grade', 'Are you sure you want to delete this grade entry?');
        if (!ok) return;
        Storage.deleteGrade(id);
        _refreshAll();
        UI.toast('Grade deleted.', 'info');
      }
    );
  }

  /* ── Analytics view ── */
  function _renderAnalytics() {
    const settings = Storage.getSettings();
    const courses  = Storage.getCourses();
    const grades   = Storage.getGrades();
    const scale    = settings.scale || '4.0';

    // Bar: avg per course
    const courseLabels = courses.map(c => c.code || c.name);
    const courseAvgs   = courses.map(c => {
      const avg = Grading.calcAverage(grades.filter(g => g.courseId === c.id));
      return avg !== null ? parseFloat(avg.toFixed(1)) : 0;
    });
    Charts.drawBar(
      document.getElementById('courseBarChart'),
      courseLabels, courseAvgs,
      { max: 100, fmt: v => v + '%', colors: courses.map(c => c.color || 'var(--gold)') }
    );

    // Radar: avg per type
    const types = ['Assignment', 'Quiz', 'Midterm', 'Final', 'Project', 'Lab'];
    const typeAvgs = types.map(t => {
      const tGrades = grades.filter(g => g.type === t);
      const avg = Grading.calcAverage(tGrades);
      return avg !== null ? parseFloat(avg.toFixed(1)) : 0;
    });
    const hasAny = typeAvgs.some(v => v > 0);
    if (hasAny) {
      Charts.drawRadar(
        document.getElementById('typeRadarChart'),
        types,
        [{ data: typeAvgs, color: 'var(--gold)' }]
      );
    } else {
      Charts.drawEmpty(document.getElementById('typeRadarChart'), 'No data');
    }

    // Line: rolling avg over time
    const sorted = [...grades].filter(g => g.date).sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length > 1) {
      let running = [], cumSum = 0;
      sorted.forEach((g, i) => {
        const pct = g.maxScore ? (g.score / g.maxScore) * 100 : 0;
        cumSum += pct;
        running.push(parseFloat((cumSum / (i + 1)).toFixed(2)));
      });
      Charts.drawLine(
        document.getElementById('progressLineChart'),
        [{ data: running, color: 'var(--blue)' }],
        { labels: sorted.map(g => g.date?.slice(5) || ''), maxY: 100 }
      );
    } else {
      Charts.drawEmpty(document.getElementById('progressLineChart'), 'Need at least 2 dated grades');
    }

    UI.renderAnalyticsSummary(courses, grades, scale);
  }

  /* ── Helpers ── */
  function _populateCourseFilter(selectId, emptyLabel) {
    const courses = Storage.getCourses();
    UI.populateSelect(
      document.getElementById(selectId),
      courses,
      'id', 'name', emptyLabel
    );
  }

  function _redrawCharts() {
    _renderCurrentView();
  }

  function _setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateEl = document.getElementById('gradeDate');
    if (dateEl) dateEl.value = today;
  }

  window.addEventListener('resize', () => {
    clearTimeout(window._resizeTimer);
    window._resizeTimer = setTimeout(_redrawCharts, 200);
  });

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
