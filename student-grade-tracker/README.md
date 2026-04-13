# GradeVault – Student Grade Tracker

> A feature-rich, zero-dependency web application for tracking academic grades, computing GPA, and visualizing performance.

![Preview](https://via.placeholder.com/900x480/141416/E8B84B?text=GradeVault+Student+Grade+Tracker)

---

## Features

| Feature | Description |
|---|---|
| **Course Management** | Add, edit, delete courses with code, credits, semester, instructor, and colour tags |
| **Grade Tracking** | Record assessments by type (Assignment, Quiz, Midterm, Final, Project, Lab) with weights |
| **Weighted Averages** | Automatic weighted/unweighted average calculation per course |
| **GPA Calculation** | Cumulative GPA on both 4.0 and 5.0 scales with credit-hour weighting |
| **Charts & Analytics** | Grade distribution donut, GPA timeline, per-course bar chart, type radar chart, rolling average |
| **CSV Export** | Export all grade data to a spreadsheet-compatible CSV file |
| **Persistent Storage** | All data saved locally in `localStorage` — works fully offline |
| **Responsive UI** | Collapsible sidebar, mobile-friendly layout |

---

## Project Structure

```
student-grade-tracker/
├── index.html              # App shell & all view markup
├── css/
│   ├── reset.css           # Minimal CSS reset
│   ├── variables.css       # Design tokens (colours, fonts, radii)
│   ├── layout.css          # Sidebar, main content, grid layouts
│   ├── components.css      # Buttons, cards, forms, table, modals, toasts
│   └── animations.css      # Keyframes & staggered entrance animations
└── js/
    ├── storage.js          # LocalStorage CRUD layer (zero dependencies)
    ├── grading.js          # Pure grade/GPA calculation functions
    ├── charts.js           # Lightweight canvas chart engine
    ├── ui.js               # DOM helpers: toasts, modals, renderers
    └── app.js              # Main controller — wires everything together
```

---

## How to Run

### Option 1 — Open directly (recommended)

```bash
# Clone or download the project
git clone https://github.com/yourname/grade-vault.git

# Open in your browser — no server needed
open index.html
# or double-click index.html in your file manager
```

### Option 2 — Local development server

```bash
# Using Python
python -m http.server 8080

# Using Node.js (npx)
npx serve .

# Then visit: http://localhost:8080
```

---

## Usage Guide

### 1. Configure your profile
Click the ⚙ icon in the sidebar footer → enter your name, student ID, and select your institution's grading scale (4.0 or 5.0).

### 2. Add a course
Click **+ Add Course** → fill in the course name, code, credits, semester, and optional instructor.

### 3. Record grades
On the **Grades** view (or via **+ Grade** on a course card) → select the course, enter the assessment name, type, score, max score, and optional weight.

### 4. View analytics
The **Analytics** view shows:
- Average score per course (bar chart)
- Performance by assessment type (radar chart)
- Rolling cumulative average over time (line chart)
- Per-course summary with progress bars

### 5. Export
Click the **↓ Export** button to download all your data as a CSV file.

---

## Grading Scales

### 4.0 Scale (Default)
| Range | Letter | Points |
|-------|--------|--------|
| 90–100 | A | 4.0 |
| 85–89 | A- | 3.7 |
| 80–84 | B+ | 3.3 |
| 75–79 | B | 3.0 |
| 70–74 | B- | 2.7 |
| 65–69 | C+ | 2.3 |
| 60–64 | C | 2.0 |
| 55–59 | C- | 1.7 |
| 50–54 | D+ | 1.3 |
| 45–49 | D | 1.0 |
| 0–44 | F | 0.0 |

### 5.0 Scale
| Range | Letter | Points |
|-------|--------|--------|
| 70–100 | A | 5.0 |
| 60–69 | B | 4.0 |
| 50–59 | C | 3.0 |
| 45–49 | D | 2.0 |
| 0–44 | F | 0.0 |

---

## Technical Design Decisions

- **No framework, no build step** — pure HTML, CSS, and vanilla JavaScript, runnable from `file://`
- **Module pattern** — each JS file exposes a single IIFE namespace (`Storage`, `Grading`, `Charts`, `UI`, `App`), keeping global scope clean without a bundler
- **Canvas charts from scratch** — no Chart.js or D3 dependency; the `Charts` module implements bar, line, donut, and radar charts in ~200 lines
- **localStorage persistence** — all data serialised as a single JSON document under the key `gradeVault`
- **Separation of concerns** — `grading.js` is pure logic (no DOM), fully unit-testable in isolation

---

## Contributing

Pull requests welcome! Please open an issue first for major changes.

---

## License

MIT © 2025 — Free to use, modify, and distribute.
