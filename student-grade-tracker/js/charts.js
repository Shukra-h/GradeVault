/**
 * charts.js
 * ─────────────────────────────────────
 * Lightweight canvas chart engine.
 * No external dependencies.
 */

const Charts = (() => {

  const C = {
    gold:   '#E8B84B',
    green:  '#5DB87A',
    blue:   '#5B9CF6',
    red:    '#E26D6D',
    purple: '#A78BFA',
    orange: '#F97316',
    bg:     '#1C1C20',
    border: '#2A2A30',
    text:   '#9190A0',
    textLt: '#F0EFE8',
    mono:   "'DM Mono', monospace",
    sans:   "'Syne', sans-serif"
  };

  const PALETTE = [C.gold, C.blue, C.green, C.red, C.purple, C.orange];

  /* ─── Shared helpers ─── */
  function dpr(canvas) {
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.parentElement ? canvas.parentElement.clientWidth : canvas.width;
    const h = parseInt(canvas.getAttribute('height')) || 220;
    canvas.width  = w * ratio;
    canvas.height = h * ratio;
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    return { ctx, w, h };
  }

  function clear({ ctx, w, h }) { ctx.clearRect(0, 0, w, h); }

  function drawEmpty(canvas, label = 'No data yet') {
    const { ctx, w, h } = dpr(canvas);
    clear({ ctx, w, h });
    ctx.font = `13px ${C.mono}`;
    ctx.fillStyle = C.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, w / 2, h / 2);
  }

  /* ─── Bar Chart ─── */
  function drawBar(canvas, labels, values, opts = {}) {
    if (!labels || labels.length === 0) { drawEmpty(canvas); return; }
    const { ctx, w, h } = dpr(canvas);
    clear({ ctx, w, h });

    const pad = { top: 20, right: 20, bottom: 42, left: 44 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;
    const max = Math.max(...values, opts.max || 0) * 1.1 || 100;
    const barW = Math.min(48, (cw / labels.length) * 0.5);
    const step = cw / labels.length;

    // Grid lines
    const lines = 4;
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    ctx.font = `10px ${C.mono}`;
    ctx.fillStyle = C.text;
    ctx.textAlign = 'right';
    for (let i = 0; i <= lines; i++) {
      const y = pad.top + ch - (i / lines) * ch;
      const val = ((i / lines) * max).toFixed(opts.integer ? 0 : 1);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + cw, y);
      ctx.stroke();
      ctx.fillText(val, pad.left - 6, y + 3);
    }

    // Bars
    labels.forEach((label, i) => {
      const x    = pad.left + step * i + step / 2 - barW / 2;
      const barH = (values[i] / max) * ch;
      const y    = pad.top + ch - barH;
      const color = opts.colors ? opts.colors[i] : PALETTE[i % PALETTE.length];

      // Shadow glow
      ctx.shadowColor = color + '55';
      ctx.shadowBlur  = 8;

      const radius = Math.min(4, barW / 3);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barW - radius, y);
      ctx.arcTo(x + barW, y, x + barW, y + radius, radius);
      ctx.lineTo(x + barW, y + barH);
      ctx.lineTo(x, y + barH);
      ctx.lineTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      ctx.shadowBlur = 0;

      // Value label
      ctx.font = `10px ${C.mono}`;
      ctx.fillStyle = C.textLt;
      ctx.textAlign = 'center';
      ctx.fillText(
        opts.fmt ? opts.fmt(values[i]) : values[i],
        x + barW / 2,
        y - 6
      );

      // X label
      ctx.fillStyle = C.text;
      ctx.font = `10px ${C.sans}`;
      const shortLabel = label.length > 10 ? label.slice(0, 9) + '…' : label;
      ctx.fillText(shortLabel, x + barW / 2, pad.top + ch + 16);
    });
  }

  /* ─── Line Chart ─── */
  function drawLine(canvas, datasets, opts = {}) {
    if (!datasets || datasets.length === 0 || !datasets[0].data.length) {
      drawEmpty(canvas); return;
    }
    const { ctx, w, h } = dpr(canvas);
    clear({ ctx, w, h });

    const pad  = { top: 20, right: 20, bottom: 36, left: 44 };
    const cw   = w - pad.left - pad.right;
    const ch   = h - pad.top  - pad.bottom;
    const allVals = datasets.flatMap(d => d.data);
    const minY = Math.max(0, Math.min(...allVals) - 0.3);
    const maxY = Math.min(opts.maxY || 4.0, Math.max(...allVals) + 0.3);
    const rangeY = maxY - minY || 1;

    const labels = opts.labels || datasets[0].data.map((_, i) => i);
    const n      = labels.length;

    function xPos(i) { return pad.left + (i / Math.max(n - 1, 1)) * cw; }
    function yPos(v) { return pad.top + ch - ((v - minY) / rangeY) * ch; }

    // Grid
    const gridLines = 4;
    ctx.strokeStyle = C.border;
    ctx.lineWidth   = 1;
    ctx.font = `10px ${C.mono}`;
    ctx.fillStyle = C.text;
    ctx.textAlign = 'right';
    for (let i = 0; i <= gridLines; i++) {
      const v = minY + (i / gridLines) * rangeY;
      const y = yPos(v);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cw, y); ctx.stroke();
      ctx.fillText(v.toFixed(2), pad.left - 6, y + 3);
    }

    // X labels
    ctx.textAlign = 'center';
    ctx.fillStyle = C.text;
    ctx.font = `10px ${C.sans}`;
    labels.forEach((lbl, i) => {
      ctx.fillText(lbl, xPos(i), pad.top + ch + 16);
    });

    // Lines + area fill
    datasets.forEach((ds, di) => {
      const color = ds.color || PALETTE[di % PALETTE.length];
      const data  = ds.data;
      if (data.length === 0) return;

      // Area
      ctx.beginPath();
      ctx.moveTo(xPos(0), yPos(data[0]));
      data.forEach((v, i) => { if (i > 0) ctx.lineTo(xPos(i), yPos(v)); });
      ctx.lineTo(xPos(data.length - 1), pad.top + ch);
      ctx.lineTo(xPos(0), pad.top + ch);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
      grad.addColorStop(0, color + '30');
      grad.addColorStop(1, color + '00');
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(xPos(0), yPos(data[0]));
      data.forEach((v, i) => { if (i > 0) ctx.lineTo(xPos(i), yPos(v)); });
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2.5;
      ctx.lineJoin    = 'round';
      ctx.stroke();

      // Dots
      data.forEach((v, i) => {
        const cx = xPos(i), cy = yPos(v);
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle   = color;
        ctx.shadowColor = color + '88';
        ctx.shadowBlur  = 6;
        ctx.fill();
        ctx.shadowBlur  = 0;
      });
    });
  }

  /* ─── Donut Chart ─── */
  function drawDonut(canvas, segments, opts = {}) {
    if (!segments || segments.length === 0) { drawEmpty(canvas); return; }
    const { ctx, w, h } = dpr(canvas);
    clear({ ctx, w, h });

    const cx = w / 2, cy = h / 2;
    const outerR = Math.min(cx, cy) - 12;
    const innerR = outerR * 0.58;
    const total  = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) { drawEmpty(canvas, 'No grades'); return; }

    let startAngle = -Math.PI / 2;
    segments.forEach((seg, i) => {
      const slice = (seg.value / total) * 2 * Math.PI;
      const color = seg.color || PALETTE[i % PALETTE.length];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle   = color;
      ctx.shadowColor = color + '44';
      ctx.shadowBlur  = 6;
      ctx.fill();
      ctx.shadowBlur  = 0;

      // % label if slice large enough
      if (slice > 0.25) {
        const mid = startAngle + slice / 2;
        const lx  = cx + (outerR * 0.78) * Math.cos(mid);
        const ly  = cy + (outerR * 0.78) * Math.sin(mid);
        ctx.font = `bold 11px ${C.mono}`;
        ctx.fillStyle   = '#fff';
        ctx.textAlign   = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(seg.value / total * 100) + '%', lx, ly);
      }

      startAngle += slice;
    });

    // Hole
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
    ctx.fillStyle = C.bg;
    ctx.fill();

    // Centre label
    if (opts.centerText) {
      ctx.font = `bold 18px ${C.mono}`;
      ctx.fillStyle   = C.textLt;
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opts.centerText, cx, cy - 8);
      ctx.font = `11px ${C.sans}`;
      ctx.fillStyle = C.text;
      ctx.fillText(opts.centerSub || '', cx, cy + 12);
    }

    // Legend
    if (opts.legend) {
      const lx = 10, startY = h - segments.length * 18 - 6;
      ctx.textAlign   = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `11px ${C.sans}`;
      segments.forEach((seg, i) => {
        const y = startY + i * 18;
        const color = seg.color || PALETTE[i % PALETTE.length];
        ctx.fillStyle = color;
        ctx.fillRect(lx, y - 5, 10, 10);
        ctx.fillStyle = C.text;
        ctx.fillText(seg.label, lx + 14, y);
      });
    }
  }

  /* ─── Radar / Spider Chart ─── */
  function drawRadar(canvas, axes, datasets) {
    if (!axes || axes.length < 3) { drawEmpty(canvas); return; }
    const { ctx, w, h } = dpr(canvas);
    clear({ ctx, w, h });

    const cx = w / 2, cy = h / 2;
    const r  = Math.min(cx, cy) - 40;
    const n  = axes.length;

    function pt(i, val, scale = 1) {
      const angle = (2 * Math.PI * i / n) - Math.PI / 2;
      return {
        x: cx + r * scale * (val / 100) * Math.cos(angle),
        y: cy + r * scale * (val / 100) * Math.sin(angle)
      };
    }
    function axPt(i, scale) {
      const angle = (2 * Math.PI * i / n) - Math.PI / 2;
      return { x: cx + r * scale * Math.cos(angle), y: cy + r * scale * Math.sin(angle) };
    }

    // Web
    [0.25, 0.5, 0.75, 1.0].forEach(scale => {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const p = axPt(i, scale);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.strokeStyle = C.border;
      ctx.lineWidth   = 1;
      ctx.stroke();
    });

    // Spokes
    for (let i = 0; i < n; i++) {
      const p = axPt(i, 1);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.stroke();

      // Axis labels
      const lp = axPt(i, 1.18);
      ctx.font = `10px ${C.sans}`;
      ctx.fillStyle   = C.text;
      ctx.textAlign   = lp.x < cx - 2 ? 'right' : lp.x > cx + 2 ? 'left' : 'center';
      ctx.textBaseline = lp.y < cy ? 'bottom' : 'top';
      ctx.fillText(axes[i], lp.x, lp.y);
    }

    // Datasets
    datasets.forEach((ds, di) => {
      const color = ds.color || PALETTE[di % PALETTE.length];
      ctx.beginPath();
      ds.data.forEach((v, i) => {
        const p = pt(i, v);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fillStyle   = color + '33';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      ctx.stroke();

      ds.data.forEach((v, i) => {
        const p = pt(i, v);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });
    });
  }

  return { drawBar, drawLine, drawDonut, drawRadar, drawEmpty };
})();
