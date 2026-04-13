/**
 * storage.js
 * ─────────────────────────────────────
 * Thin wrapper around localStorage.
 * All data lives under the key "gradeVault".
 *
 * Schema:
 *   {
 *     settings: { name, studentID, institution, scale },
 *     courses:  [ { id, name, code, credits, semester, instructor, color, scale, createdAt } ],
 *     grades:   [ { id, courseId, name, type, score, maxScore, weight, date, notes, createdAt } ]
 *   }
 */

const Storage = (() => {
  const KEY = 'gradeVault';

  const _defaults = () => ({
    settings: { name: 'Student', studentID: '', institution: '', scale: '4.0' },
    courses:  [],
    grades:   []
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return Object.assign(_defaults(), parsed);
    } catch {
      return _defaults();
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function getData() { return load(); }

  /* ── Settings ── */
  function getSettings()         { return load().settings; }
  function saveSettings(s)       { const d = load(); d.settings = { ...d.settings, ...s }; save(d); }

  /* ── Courses ── */
  function getCourses()          { return load().courses; }
  function getCourse(id)         { return load().courses.find(c => c.id === id) || null; }
  function addCourse(course) {
    const d = load();
    course.id = _uid();
    course.createdAt = Date.now();
    d.courses.push(course);
    save(d);
    return course;
  }
  function updateCourse(id, updates) {
    const d = load();
    const idx = d.courses.findIndex(c => c.id === id);
    if (idx === -1) return null;
    d.courses[idx] = { ...d.courses[idx], ...updates };
    save(d);
    return d.courses[idx];
  }
  function deleteCourse(id) {
    const d = load();
    d.courses = d.courses.filter(c => c.id !== id);
    d.grades  = d.grades.filter(g => g.courseId !== id);   // cascade
    save(d);
  }

  /* ── Grades ── */
  function getGrades(courseId)   {
    const grades = load().grades;
    return courseId ? grades.filter(g => g.courseId === courseId) : grades;
  }
  function addGrade(grade) {
    const d = load();
    grade.id = _uid();
    grade.createdAt = Date.now();
    d.grades.push(grade);
    save(d);
    return grade;
  }
  function updateGrade(id, updates) {
    const d = load();
    const idx = d.grades.findIndex(g => g.id === id);
    if (idx === -1) return null;
    d.grades[idx] = { ...d.grades[idx], ...updates };
    save(d);
    return d.grades[idx];
  }
  function deleteGrade(id) {
    const d = load();
    d.grades = d.grades.filter(g => g.id !== id);
    save(d);
  }

  function clearAll() { save(_defaults()); }

  /* ── Helpers ── */
  function _uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

  return {
    getData, getSettings, saveSettings,
    getCourses, getCourse, addCourse, updateCourse, deleteCourse,
    getGrades, addGrade, updateGrade, deleteGrade,
    clearAll
  };
})();
