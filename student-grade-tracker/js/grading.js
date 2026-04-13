/**
 * grading.js
 * ─────────────────────────────────────
 * Pure functions for grade calculation.
 * No DOM or storage dependencies.
 */

const Grading = (() => {

  /* ── Letter grade thresholds ── */
  const LETTER_4 = [
    { min: 90, letter: 'A',  points: 4.0 },
    { min: 85, letter: 'A-', points: 3.7 },
    { min: 80, letter: 'B+', points: 3.3 },
    { min: 75, letter: 'B',  points: 3.0 },
    { min: 70, letter: 'B-', points: 2.7 },
    { min: 65, letter: 'C+', points: 2.3 },
    { min: 60, letter: 'C',  points: 2.0 },
    { min: 55, letter: 'C-', points: 1.7 },
    { min: 50, letter: 'D+', points: 1.3 },
    { min: 45, letter: 'D',  points: 1.0 },
    { min: 0,  letter: 'F',  points: 0.0 }
  ];

  const LETTER_5 = [
    { min: 70, letter: 'A',  points: 5.0 },
    { min: 60, letter: 'B',  points: 4.0 },
    { min: 50, letter: 'C',  points: 3.0 },
    { min: 45, letter: 'D',  points: 2.0 },
    { min: 0,  letter: 'F',  points: 0.0 }
  ];

  /**
   * Convert a percentage score to a letter and grade point.
   * @param {number} pct   – 0-100
   * @param {string} scale – '4.0' | '5.0'
   */
  function percentToGrade(pct, scale = '4.0') {
    const table = scale === '5.0' ? LETTER_5 : LETTER_4;
    for (const row of table) {
      if (pct >= row.min) return { letter: row.letter, points: row.points };
    }
    return { letter: 'F', points: 0 };
  }

  /**
   * Calculate the average score (%) for an array of grade entries.
   * Supports weighted and unweighted modes.
   * Weighted: weight values are treated as relative percentages of the course mark.
   * Unweighted: simple mean of (score/maxScore * 100).
   *
   * @param {Array}  grades  – grade objects from storage
   * @returns {number|null}  – percentage 0–100, or null if no grades
   */
  function calcAverage(grades) {
    if (!grades || grades.length === 0) return null;

    const weighted = grades.filter(g => g.weight != null && g.weight !== '');
    const unweighted = grades.filter(g => g.weight == null || g.weight === '');

    let totalScore = 0;
    let totalWeight = 0;

    if (weighted.length > 0) {
      for (const g of weighted) {
        const pct = (g.score / g.maxScore) * 100;
        const w   = parseFloat(g.weight) || 0;
        totalScore  += pct * w;
        totalWeight += w;
      }
    }

    // Unweighted items split remaining weight equally
    if (unweighted.length > 0) {
      const remaining = Math.max(0, 100 - totalWeight);
      const share     = remaining / unweighted.length;
      for (const g of unweighted) {
        const pct = (g.score / g.maxScore) * 100;
        totalScore  += pct * share;
        totalWeight += share;
      }
    }

    if (totalWeight === 0) return null;
    return Math.min(100, totalScore / totalWeight);
  }

  /**
   * Compute cumulative GPA across courses.
   * Each course contributes: gradePoints * credits.
   *
   * @param {Array} courses  – course objects
   * @param {Array} grades   – all grade objects
   * @param {string} scale
   * @returns {{ gpa: number|null, totalCredits: number }}
   */
  function calcGPA(courses, grades, scale = '4.0') {
    let weightedSum  = 0;
    let totalCredits = 0;

    for (const course of courses) {
      const courseGrades = grades.filter(g => g.courseId === course.id);
      const avg = calcAverage(courseGrades);
      if (avg === null) continue;

      const { points } = percentToGrade(avg, scale || course.scale || '4.0');
      const credits = parseFloat(course.credits) || 3;
      weightedSum  += points * credits;
      totalCredits += credits;
    }

    if (totalCredits === 0) return { gpa: null, totalCredits: 0 };
    return { gpa: weightedSum / totalCredits, totalCredits };
  }

  /**
   * Compute GPA per unique semester.
   * @returns {Array} [{ semester, gpa, courses }]
   */
  function calcSemesterGPAs(courses, grades, scale = '4.0') {
    const semesters = [...new Set(courses.map(c => c.semester).filter(Boolean))];
    return semesters.map(sem => {
      const semCourses = courses.filter(c => c.semester === sem);
      const { gpa } = calcGPA(semCourses, grades, scale);
      return { semester: sem, gpa: gpa ?? 0, courses: semCourses.length };
    });
  }

  /**
   * Get the letter grade class for CSS (A/B/C/D/F).
   */
  function gradeClass(letter) {
    if (!letter) return 'grade-F';
    return 'grade-' + letter[0];
  }

  /**
   * Format a GPA number for display.
   */
  function fmtGPA(val) {
    if (val === null || val === undefined) return '—';
    return val.toFixed(2);
  }

  /**
   * Format a percentage for display.
   */
  function fmtPct(val) {
    if (val === null || val === undefined) return '—';
    return val.toFixed(1) + '%';
  }

  return {
    percentToGrade,
    calcAverage,
    calcGPA,
    calcSemesterGPAs,
    gradeClass,
    fmtGPA,
    fmtPct
  };
})();
