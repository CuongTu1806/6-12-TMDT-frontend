import { useEffect, useState, useCallback, useRef } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  CheckCircle, BarChart2, Award, Minus, RefreshCw,
  ArrowUpRight, ArrowDownRight, Tag, Layers, Target,
  Calendar, Zap, Package, Star, ShoppingCart,
} from 'lucide-react'
import { getSellerRevenue, getSellerAdvancedStatistics } from '../../services/sellerApi'

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */
const fmt = (v) => `${Number(v || 0).toLocaleString('vi-VN')}₫`
const fmtShort = (v) => {
  const n = Number(v || 0)
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}T₫`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}tr₫`
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}k₫`
  return `${n}₫`
}

function getPreset(id) {
  const today = new Date()
  const f = (d) => d.toISOString().slice(0, 10)
  if (id === '7d')  { const d = new Date(today); d.setDate(today.getDate() - 6);  return { from: f(d), to: f(today) } }
  if (id === '30d') { const d = new Date(today); d.setDate(today.getDate() - 29); return { from: f(d), to: f(today) } }
  if (id === 'thisMonth') {
    return { from: f(new Date(today.getFullYear(), today.getMonth(), 1)), to: f(today) }
  }
  if (id === 'lastMonth') {
    const first = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const last  = new Date(today.getFullYear(), today.getMonth(), 0)
    return { from: f(first), to: f(last) }
  }
  return null
}

/* ═══════════════════════════════════════════════════════════════════════════
   SVG DONUT CHART
═══════════════════════════════════════════════════════════════════════════ */
function DonutChart({ segments = [], size = 140, thickness = 24 }) {
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t) }, [segments])
  const r    = (size - thickness) / 2
  const circ = 2 * Math.PI * r
  const cx = size / 2, cy = size / 2
  const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1
  let offset = 0
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block', flexShrink: 0 }}>
      {segments.map((seg, i) => {
        const frac = (seg.value || 0) / total
        const dash = ready ? frac * circ : 0
        const gap  = circ - dash
        const o    = offset
        offset += frac * circ
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={seg.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-o}
            style={{ transition: 'stroke-dasharray .9s cubic-bezier(.4,0,.2,1)' }}
          />
        )
      })}
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SVG LINE CHART — hover tooltip, animated draw-in, area gradient
   Works cleanly for 1 → 90+ data points
═══════════════════════════════════════════════════════════════════════════ */
function LineChart({ data = [], height = 220 }) {
  const svgRef = useRef(null)
  const [hover, setHover] = useState(null) // { index, svgX, svgY, row }
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    setDrawn(false)
    setHover(null)
    const t = setTimeout(() => setDrawn(true), 80)
    return () => clearTimeout(t)
  }, [data])

  if (!data.length) return (
    <div style={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: 8 }}>
      <BarChart2 size={36} style={{ opacity: .25 }} />
      <span style={{ fontSize: 13 }}>Không có dữ liệu</span>
    </div>
  )

  /* ── layout ── */
  const VW = 600, VH = 200
  const PAD = { top: 24, right: 16, bottom: 28, left: 52 }
  const IW  = VW - PAD.left - PAD.right
  const IH  = VH - PAD.top  - PAD.bottom

  const maxRev = Math.max(...data.map(d => d.revenue), 1)
  const minRev = Math.min(...data.map(d => d.revenue), 0)
  const range  = maxRev - minRev || 1

  /* ── map to SVG points ── */
  const pts = data.map((row, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * IW,
    y: PAD.top  + (1 - (row.revenue - minRev) / range) * IH,
    row,
  }))

  /* ── smooth cubic bezier path ── */
  const buildPath = (points) => {
    if (!points.length) return ''
    if (points.length === 1)
      return `M ${points[0].x} ${points[0].y} H ${PAD.left + IW}`
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1], p1 = points[i]
      const cx = (p0.x + p1.x) / 2
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`
    }
    return d
  }

  const linePath = buildPath(pts)
  const areaPath = pts.length === 1
    ? `M ${pts[0].x} ${pts[0].y} H ${PAD.left + IW} V ${PAD.top + IH} H ${PAD.left} Z`
    : `${linePath} L ${pts[pts.length - 1].x} ${PAD.top + IH} L ${pts[0].x} ${PAD.top + IH} Z`

  /* ── y-axis ticks ── */
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y:   PAD.top + (1 - f) * IH,
    val: minRev + f * range,
  }))

  /* ── x-axis labels (max ~6) ── */
  const xStep   = Math.max(1, Math.ceil(data.length / 6))
  const xLabels = pts.filter((_, i) => i % xStep === 0 || i === pts.length - 1)

  /* ── mouse → nearest point ── */
  const onMouseMove = (e) => {
    const svg  = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mx   = (e.clientX - rect.left) * (VW / rect.width)
    let best = 0, bestD = Infinity
    pts.forEach((p, i) => {
      const d = Math.abs(p.x - mx)
      if (d < bestD) { bestD = d; best = i }
    })
    setHover({ index: best, svgX: pts[best].x, svgY: pts[best].y, row: pts[best].row })
  }

  /* ── tooltip flip so it doesn't go off right edge ── */
  const tipX = hover ? (hover.svgX > VW * 0.65 ? hover.svgX - 134 : hover.svgX + 14) : 0
  const tipY = hover ? Math.max(PAD.top, hover.svgY - 44) : 0

  return (
    <div style={{ position: 'relative', height }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible', cursor: 'crosshair' }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="lc-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="lc-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
          {/* animated clip: grows from left to right */}
          <clipPath id="lc-clip">
            <rect
              x={PAD.left} y={0}
              width={drawn ? IW : 0}
              height={VH}
              style={{ transition: 'width 1.2s cubic-bezier(.4,0,.2,1)' }}
            />
          </clipPath>
        </defs>

        {/* Y grid + labels */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left} y1={t.y} x2={PAD.left + IW} y2={t.y}
              stroke="rgba(148,163,184,.13)" strokeWidth="1" strokeDasharray="5 4"
            />
            <text x={PAD.left - 6} y={t.y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">
              {fmtShort(t.val)}
            </text>
          </g>
        ))}

        {/* X axis baseline */}
        <line
          x1={PAD.left} y1={PAD.top + IH}
          x2={PAD.left + IW} y2={PAD.top + IH}
          stroke="rgba(148,163,184,.3)" strokeWidth="1"
        />

        {/* X labels */}
        {xLabels.map((p, i) => (
          <text key={i} x={p.x} y={VH - 4} textAnchor="middle" fontSize="9" fill="#64748b">
            {p.row.date?.slice(5)}
          </text>
        ))}

        {/* Area fill (clipped = animated) */}
        <g clipPath="url(#lc-clip)">
          <path d={areaPath} fill="url(#lc-area)" />
        </g>

        {/* Line (clipped = animated) */}
        <g clipPath="url(#lc-clip)">
          <path
            d={linePath}
            fill="none"
            stroke="url(#lc-line)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Dots — show when ≤14 points */}
        {data.length <= 14 && pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y}
            r={hover?.index === i ? 5.5 : 3}
            fill={hover?.index === i ? '#fff' : '#6366f1'}
            stroke="#6366f1"
            strokeWidth={hover?.index === i ? 2.5 : 0}
            style={{ transition: 'r .12s', pointerEvents: 'none' }}
          />
        ))}

        {/* Hover crosshair + tooltip */}
        {hover && (
          <g style={{ pointerEvents: 'none' }}>
            {/* vertical dashed line */}
            <line
              x1={hover.svgX} y1={PAD.top}
              x2={hover.svgX} y2={PAD.top + IH}
              stroke="rgba(99,102,241,.35)" strokeWidth="1.5" strokeDasharray="4 3"
            />
            {/* outer ring */}
            <circle cx={hover.svgX} cy={hover.svgY} r={7}
              fill="#fff" stroke="#6366f1" strokeWidth="2.5" />
            {/* inner dot */}
            <circle cx={hover.svgX} cy={hover.svgY} r={3.5} fill="#6366f1" />

            {/* tooltip via foreignObject */}
            <foreignObject x={tipX} y={tipY} width="130" height="78" style={{ overflow: 'visible' }}>
              <div style={{
                display: 'inline-block',
                background: '#1e293b',
                border: '1px solid rgba(99,102,241,.45)',
                borderRadius: 11,
                padding: '8px 13px',
                color: '#fff',
                fontSize: 11,
                whiteSpace: 'nowrap',
                boxShadow: '0 6px 24px rgba(0,0,0,.45)',
              }}>
                <p style={{ color: '#94a3b8', marginBottom: 3 }}>{hover.row.date}</p>
                <p style={{ color: '#a78bfa', fontWeight: 800, fontSize: 14, marginBottom: 3 }}>
                  {fmtShort(hover.row.revenue)}
                </p>
                <p style={{ color: '#64748b', fontSize: 10 }}>{hover.row.orderCount} đơn</p>
              </div>
            </foreignObject>
          </g>
        )}
      </svg>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   KPI CARD
═══════════════════════════════════════════════════════════════════════════ */
function KpiCard({ icon: Icon, label, value, sub, accent = '#6366f1', trend }) {
  return (
    <div className="rp-kpi">
      <div className="rp-kpi-icon" style={{ background: `${accent}1a`, color: accent }}>
        <Icon size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="rp-kpi-label">{label}</p>
        <p className="rp-kpi-value">{value ?? '—'}</p>
        {sub && <p className="rp-kpi-sub">{sub}</p>}
      </div>
      {trend != null && (
        <div className={`rp-trend ${trend >= 0 ? 'rp-trend-up' : 'rp-trend-dn'}`}>
          {trend > 0 ? <ArrowUpRight size={12} /> : trend < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOP PRODUCT ROW
═══════════════════════════════════════════════════════════════════════════ */
const MEDALS = ['🥇', '🥈', '🥉']

function TopProductRow({ rank, item, maxVal, sortMode }) {
  const pct = maxVal > 0
    ? ((sortMode === 'qty' ? item.totalQuantitySold : item.totalRevenue) / maxVal) * 100
    : 0
  return (
    <div className="rp-top-row">
      <span className="rp-top-medal">{MEDALS[rank] || `#${rank + 1}`}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="rp-top-name" title={item.productName}>{item.productName}</p>
        {item.variantLabel && (
          <p className="rp-top-variant">
            <Tag size={9} style={{ display: 'inline', marginRight: 3 }} />
            {item.variantLabel}
          </p>
        )}
        <div style={{ height: 4, background: '#1e1b4b', borderRadius: 2, marginTop: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(to right,#6366f1,#a78bfa)', borderRadius: 2, transition: 'width .9s' }} />
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: '#94a3b8' }}>{item.totalQuantitySold} sp</p>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>{fmtShort(item.totalRevenue)}</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   GROWTH BADGE
═══════════════════════════════════════════════════════════════════════════ */
function GrowthBadge({ rate }) {
  if (rate == null) return null
  const up = rate > 0, flat = rate === 0
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '7px 16px', borderRadius: 20,
      background: up ? 'rgba(16,185,129,.15)' : flat ? 'rgba(148,163,184,.15)' : 'rgba(239,68,68,.15)',
      color: up ? '#10b981' : flat ? '#94a3b8' : '#ef4444',
      fontSize: 13, fontWeight: 700,
    }}>
      {up ? <TrendingUp size={14} /> : flat ? <Minus size={14} /> : <TrendingDown size={14} />}
      {rate > 0 ? '+' : ''}{rate.toFixed(1)}% so với kỳ trước
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPARISON BLOCK
═══════════════════════════════════════════════════════════════════════════ */
function ComparisonBlock({ data }) {
  const { currentPeriodRevenue, previousPeriodRevenue, growthRate } = data
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>Kỳ hiện tại</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{fmtShort(currentPeriodRevenue)}</p>
        </div>
        <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,.15)', margin: '0 auto' }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>Kỳ trước</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'rgba(255,255,255,.4)' }}>{fmtShort(previousPeriodRevenue)}</p>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <GrowthBadge rate={growthRate} />
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════════════════════════ */
const CSS = `
.rp-wrap { display:flex; flex-direction:column; gap:18px; font-family:inherit; }

/* ── hero ── */
.rp-hero {
  border-radius:20px; padding:28px 28px 24px;
  background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);
  color:#fff; position:relative; overflow:hidden;
}
.rp-hero::before {
  content:''; position:absolute; inset:0;
  background:radial-gradient(ellipse at 80% 10%,rgba(99,102,241,.35),transparent 60%);
  pointer-events:none;
}
.rp-hero-glow {
  position:absolute; right:-50px; top:-50px;
  width:240px; height:240px; border-radius:50%;
  background:radial-gradient(circle,rgba(167,139,250,.2),transparent 70%);
  pointer-events:none;
}
.rp-hero-title { font-size:22px; font-weight:800; margin:0 0 4px; position:relative; }
.rp-hero-sub   { font-size:13px; color:rgba(255,255,255,.5); margin:0 0 20px; position:relative; }
.rp-hero-nums  { display:flex; flex-wrap:wrap; gap:28px; position:relative; }
.rp-hero-num-val { font-size:26px; font-weight:800; }
.rp-hero-num-lbl { font-size:11px; color:rgba(255,255,255,.45); margin-top:2px; }

/* ── filter ── */
.rp-filter {
  background:#fff; border:1px solid #e2e8f0; border-radius:14px;
  padding:14px 18px; display:flex; flex-wrap:wrap; align-items:flex-end; gap:10px;
}
.rp-preset-btn {
  padding:5px 13px; border-radius:8px; border:1px solid #e2e8f0;
  font-size:12px; font-weight:600; cursor:pointer;
  background:#f8fafc; color:#64748b; transition:all .15s;
}
.rp-preset-btn:hover  { background:#eef2ff; border-color:#a5b4fc; color:#4f46e5; }
.rp-preset-btn.active { background:#4f46e5; border-color:#4f46e5; color:#fff; }
.rp-date-input {
  padding:6px 10px; border:1px solid #e2e8f0; border-radius:8px;
  font-size:13px; outline:none; transition:border-color .15s;
}
.rp-date-input:focus { border-color:#a5b4fc; }
.rp-filter-lbl { font-size:11px; font-weight:600; color:#64748b; }
.rp-apply-btn {
  padding:7px 18px; background:linear-gradient(135deg,#4f46e5,#7c3aed);
  color:#fff; border:none; border-radius:9px; font-size:13px; font-weight:600;
  cursor:pointer; display:flex; align-items:center; gap:6px; transition:opacity .15s;
}
.rp-apply-btn:hover    { opacity:.9; }
.rp-apply-btn:disabled { opacity:.4; cursor:default; }

/* ── section title ── */
.rp-sec {
  font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase;
  letter-spacing:.07em; margin-bottom:10px; display:flex; align-items:center; gap:5px;
}

/* ── KPI cards ── */
.rp-kpi-grid { display:grid; gap:12px; grid-template-columns:repeat(auto-fill,minmax(185px,1fr)); }
.rp-kpi {
  background:#fff; border:1px solid #e2e8f0; border-radius:14px;
  padding:14px 16px; display:flex; align-items:flex-start; gap:12px;
  position:relative; transition:box-shadow .2s, transform .2s;
}
.rp-kpi:hover { box-shadow:0 6px 24px rgba(99,102,241,.1); transform:translateY(-2px); }
.rp-kpi-icon { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.rp-kpi-label { font-size:11px; color:#94a3b8; }
.rp-kpi-value { font-size:18px; font-weight:800; color:#0f172a; line-height:1.2; word-break:break-all; }
.rp-kpi-sub   { font-size:11px; color:#64748b; margin-top:2px; }
.rp-trend {
  position:absolute; top:10px; right:10px;
  display:flex; align-items:center; gap:2px;
  font-size:10px; font-weight:700; padding:2px 7px; border-radius:20px;
}
.rp-trend-up { background:#f0fdf4; color:#16a34a; }
.rp-trend-dn { background:#fff1f2; color:#e11d48; }

/* ── white card ── */
.rp-card { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:20px; }

/* ── dark card ── */
.rp-dark {
  border-radius:16px; padding:20px;
  background:linear-gradient(135deg,#0f0c29f0,#1e1b4bf0);
  border:1px solid rgba(99,102,241,.22);
}

/* ── 2 column ── */
.rp-2col { display:grid; gap:14px; grid-template-columns:1fr 1fr; }
@media(max-width:760px) { .rp-2col { grid-template-columns:1fr; } }

/* ── donut ── */
.rp-donut-wrap { display:flex; align-items:center; gap:18px; flex-wrap:wrap; }
.rp-donut-legend { display:flex; flex-direction:column; gap:8px; flex:1; min-width:120px; }
.rp-legend-row  { display:flex; align-items:center; gap:8px; }
.rp-legend-dot  { width:10px; height:10px; border-radius:50%; flex-shrink:0; }

/* ── breakdown ── */
.rp-bdrow {
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 14px; border-radius:10px; font-size:13px;
  background:#f8fafc; margin-bottom:8px;
}
.rp-bdrow.net { background:linear-gradient(135deg,#ecfdf5,#d1fae5); border:1px solid #6ee7b7; }
.rp-bdrow-left { display:flex; align-items:center; gap:8px; color:#334155; }
.rp-bdrow-dot  { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.rp-bdrow-val  { font-weight:700; }

/* ── top products ── */
.rp-top-toggle { display:flex; gap:6px; margin-bottom:14px; }
.rp-top-toggle-btn {
  padding:4px 12px; border-radius:8px; border:1px solid rgba(99,102,241,.25);
  font-size:11px; font-weight:600; cursor:pointer;
  background:transparent; color:rgba(255,255,255,.5); transition:all .15s;
}
.rp-top-toggle-btn.active { background:#6366f1; border-color:#6366f1; color:#fff; }
.rp-top-row {
  display:flex; align-items:center; gap:12px;
  padding:10px 0; border-bottom:1px solid rgba(99,102,241,.1);
}
.rp-top-row:last-child { border-bottom:none; }
.rp-top-medal { font-size:20px; width:28px; flex-shrink:0; text-align:center; }
.rp-top-name { font-size:13px; font-weight:600; color:#e2e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.rp-top-variant { font-size:10px; color:#6366f1; margin-top:2px; }

/* ── day table ── */
.rp-table { width:100%; border-collapse:collapse; font-size:13px; }
.rp-table thead th {
  text-align:left; padding:8px 12px; font-size:10px; font-weight:700;
  color:#94a3b8; border-bottom:1px solid #f1f5f9; text-transform:uppercase; letter-spacing:.05em;
}
.rp-table tbody td { padding:9px 12px; }
.rp-table tbody tr { border-bottom:1px solid #f8fafc; transition:background .1s; }
.rp-table tbody tr:hover { background:#f8fafc; }
.rp-rev-cell { font-weight:700; color:#059669; }
.rp-mini-bar { display:inline-block; height:6px; border-radius:3px; background:linear-gradient(to right,#6366f1,#a78bfa); vertical-align:middle; }

/* ── loading ── */
.rp-loading { display:flex; align-items:center; justify-content:center; gap:10px; padding:50px; color:#94a3b8; font-size:14px; }
.rp-spinner { width:20px; height:20px; border:2px solid #e2e8f0; border-top-color:#6366f1; border-radius:50%; animation:rp-spin .6s linear infinite; }
@keyframes rp-spin { to { transform:rotate(360deg); } }
.rp-err { background:#fff1f2; border:1px solid #fecdd3; border-radius:12px; padding:16px; color:#e11d48; font-size:13px; text-align:center; }
`

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export function SellerRevenuePanel() {
  const [from, setFrom]               = useState(() => getPreset('30d').from)
  const [to,   setTo]                 = useState(() => getPreset('30d').to)
  const [activePreset, setActivePreset] = useState('30d')
  const [basicData,    setBasicData]  = useState(null)
  const [advData,      setAdvData]    = useState(null)
  const [loading,      setLoading]    = useState(true)
  const [error,        setError]      = useState(null)
  const [topSortMode,  setTopSortMode] = useState('revenue')

  const load = useCallback(async (f, t) => {
    setLoading(true)
    setError(null)
    try {
      const [basic, adv] = await Promise.allSettled([
        getSellerRevenue(f, t),
        getSellerAdvancedStatistics(f, t),
      ])
      setBasicData(basic.status === 'fulfilled' ? basic.value : null)
      setAdvData(adv.status   === 'fulfilled' ? adv.value   : null)
      if (basic.status === 'rejected' && adv.status === 'rejected') {
        setError(basic.reason?.message || 'Lỗi tải dữ liệu')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(from, to) }, [])

  const handlePreset = (id) => {
    const p = getPreset(id)
    if (!p) return
    setActivePreset(id)
    setFrom(p.from)
    setTo(p.to)
    load(p.from, p.to)
  }

  const handleApply = () => {
    setActivePreset(null)
    load(from, to)
  }

  /* ── derived ── */
  const growth     = advData?.revenueComparison?.growthRate ?? null
  const actual     = advData?.actualRevenue     || null
  const comparison = advData?.revenueComparison || null
  const avgMetrics = advData?.averageMetrics    || null
  const byDay      = basicData?.byDay           || []
  const maxDayRev  = Math.max(...byDay.map(d => d.revenue), 1)

  const allTopProducts = advData?.topSellingProducts || []
  const topProducts    = [...allTopProducts].sort((a, b) =>
    topSortMode === 'qty'
      ? b.totalQuantitySold - a.totalQuantitySold
      : b.totalRevenue      - a.totalRevenue
  ).slice(0, 5)
  const maxTopVal = Math.max(
    ...topProducts.map(p => topSortMode === 'qty' ? p.totalQuantitySold : p.totalRevenue),
    1
  )

  const donutSegs = actual ? [
    { label: 'Thực nhận', value: actual.netRevenue,     color: '#6366f1' },
    { label: 'Phí sàn',   value: actual.platformFee,    color: '#f43f5e' },
    { label: 'Voucher',   value: actual.voucherDiscount, color: '#f59e0b' },
  ] : []

  const hasData = basicData || advData

  return (
    <div className="rp-wrap">
      <style>{CSS}</style>

      {/* HERO */}
      <div className="rp-hero">
        <div className="rp-hero-glow" />
        <h1 className="rp-hero-title">📊 Doanh thu &amp; Thống kê Shop</h1>
        <p className="rp-hero-sub">Phân tích doanh thu, sản phẩm bán chạy và so sánh theo kỳ</p>
        {basicData && (
          <div className="rp-hero-nums">
            <div>
              <p className="rp-hero-num-val">{fmtShort(basicData.totalRevenue)}</p>
              <p className="rp-hero-num-lbl">Doanh thu gộp kỳ này</p>
            </div>
            {actual && (
              <div>
                <p className="rp-hero-num-val" style={{ color: '#a78bfa' }}>{fmtShort(actual.netRevenue)}</p>
                <p className="rp-hero-num-lbl">Thực nhận</p>
              </div>
            )}
            <div>
              <p className="rp-hero-num-val" style={{ color: '#34d399' }}>{basicData.completedOrders}</p>
              <p className="rp-hero-num-lbl">Đơn hoàn thành</p>
            </div>
            {growth != null && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                <GrowthBadge rate={growth} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* FILTER */}
      <div className="rp-filter">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: '7d',        label: '7 ngày' },
            { id: '30d',       label: '30 ngày' },
            { id: 'thisMonth', label: 'Tháng này' },
            { id: 'lastMonth', label: 'Tháng trước' },
          ].map(p => (
            <button key={p.id} type="button"
              className={`rp-preset-btn ${activePreset === p.id ? 'active' : ''}`}
              onClick={() => handlePreset(p.id)}
            >{p.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
          <label className="rp-filter-lbl">Từ</label>
          <input type="date" className="rp-date-input" value={from}
            onChange={e => { setFrom(e.target.value); setActivePreset(null) }} />
          <label className="rp-filter-lbl">Đến</label>
          <input type="date" className="rp-date-input" value={to}
            onChange={e => { setTo(e.target.value); setActivePreset(null) }} />
          <button type="button" className="rp-apply-btn" onClick={handleApply} disabled={loading}>
            <RefreshCw size={13} /> Xem
          </button>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="rp-loading">
          <div className="rp-spinner" />
          Đang tải dữ liệu thống kê...
        </div>
      )}

      {/* ERROR */}
      {!loading && error && <div className="rp-err">⚠️ {error}</div>}

      {/* CONTENT */}
      {!loading && hasData && (
        <>
          {/* 1. KPI tổng quan */}
          <div>
            <p className="rp-sec"><Zap size={12} /> Chỉ số tổng quan</p>
            <div className="rp-kpi-grid">
              <KpiCard icon={DollarSign}  label="Doanh thu gộp"
                value={fmt(basicData?.totalRevenue ?? comparison?.currentPeriodRevenue)}
                accent="#6366f1" trend={growth} />
              <KpiCard icon={CheckCircle} label="Doanh thu thực nhận"
                value={fmt(actual?.netRevenue)}
                sub={actual ? 'Sau phí sàn & voucher' : undefined}
                accent="#10b981" />
              <KpiCard icon={ShoppingBag} label="Đơn hoàn thành"
                value={basicData?.completedOrders ?? '—'}
                sub={basicData ? `/ ${basicData.totalOrders} tổng đơn` : undefined}
                accent="#7c3aed" />
              <KpiCard icon={Target} label="Giá trị đơn trung bình"
                value={fmt(avgMetrics?.averageOrderValue)}
                accent="#f59e0b" />
            </div>
          </div>

          {/* 2. Chi phí & khấu trừ */}
          {actual && (
            <div>
              <p className="rp-sec"><Layers size={12} /> Chi phí &amp; khấu trừ thực tế</p>
              <div className="rp-kpi-grid">
                <KpiCard icon={Layers} label="Phí sàn" value={fmt(actual.platformFee)}
                  sub="Đã khấu trừ" accent="#f43f5e" />
                <KpiCard icon={Tag} label="Giảm giá voucher shop" value={fmt(actual.voucherDiscount)}
                  sub="Voucher do shop tạo" accent="#f97316" />
                <KpiCard icon={Star} label="Tỉ lệ phí sàn"
                  value={actual.grossRevenue > 0
                    ? `${((actual.platformFee / actual.grossRevenue) * 100).toFixed(1)}%`
                    : '—'}
                  sub={`Trên ${fmtShort(actual.grossRevenue)} gộp`}
                  accent="#94a3b8" />
                <KpiCard icon={ShoppingCart} label="Tỉ lệ hoàn thành"
                  value={basicData?.totalOrders > 0
                    ? `${((basicData.completedOrders / basicData.totalOrders) * 100).toFixed(1)}%`
                    : '—'}
                  sub="Đơn hoàn thành / tổng đơn"
                  accent="#06b6d4" />
              </div>
            </div>
          )}

          {/* 3. LINE CHART + DONUT */}
          <div className="rp-2col">
            <div className="rp-card">
              <p className="rp-sec"><BarChart2 size={12} /> Doanh thu theo ngày</p>
              <LineChart data={byDay} height={220} />
              {byDay.length > 0 && (
                <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 6, textAlign: 'center' }}>
                  Di chuột vào biểu đồ để xem chi tiết từng ngày
                </p>
              )}
            </div>

            {actual ? (
              <div className="rp-card">
                <p className="rp-sec"><DollarSign size={12} /> Cơ cấu doanh thu thực tế</p>
                <div className="rp-donut-wrap">
                  <DonutChart segments={donutSegs} size={140} thickness={24} />
                  <div className="rp-donut-legend">
                    {donutSegs.map((s, i) => (
                      <div key={i} className="rp-legend-row">
                        <span className="rp-legend-dot" style={{ background: s.color }} />
                        <div>
                          <p style={{ fontSize: 11, color: '#64748b' }}>{s.label}</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmtShort(s.value)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  {[
                    { label: 'Doanh thu gộp',   val: actual.grossRevenue,    color: '#6366f1', icon: DollarSign },
                    { label: 'Phí sàn',          val: actual.platformFee,     color: '#f43f5e', icon: Layers,       neg: true },
                    { label: 'Voucher giảm giá', val: actual.voucherDiscount, color: '#f59e0b', icon: Tag,          neg: true },
                    { label: 'Thực nhận',        val: actual.netRevenue,      color: '#10b981', icon: CheckCircle,  net: true },
                  ].map((r, i) => (
                    <div key={i} className={`rp-bdrow${r.net ? ' net' : ''}`}>
                      <div className="rp-bdrow-left">
                        <span className="rp-bdrow-dot" style={{ background: r.color }} />
                        <r.icon size={13} style={{ color: r.color }} />
                        <span>{r.label}</span>
                      </div>
                      <span className="rp-bdrow-val" style={{ color: r.color }}>
                        {r.neg ? '-' : ''}{fmt(Math.abs(r.val || 0))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              comparison && (
                <div className="rp-dark">
                  <p className="rp-sec" style={{ color: 'rgba(255,255,255,.4)' }}>
                    <TrendingUp size={12} /> So sánh kỳ trước
                  </p>
                  <ComparisonBlock data={comparison} />
                </div>
              )
            )}
          </div>

          {/* 4. SO SÁNH + TOP SẢN PHẨM */}
          <div className="rp-2col">
            {comparison && actual && (
              <div className="rp-dark">
                <p className="rp-sec" style={{ color: 'rgba(255,255,255,.4)' }}>
                  <TrendingUp size={12} /> So sánh với kỳ trước
                </p>
                <ComparisonBlock data={comparison} />
              </div>
            )}

            {allTopProducts.length > 0 && (
              <div className="rp-dark">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p className="rp-sec" style={{ color: 'rgba(255,255,255,.4)', margin: 0 }}>
                    <Award size={12} /> Top sản phẩm bán chạy
                  </p>
                  <div className="rp-top-toggle">
                    <button type="button"
                      className={`rp-top-toggle-btn ${topSortMode === 'revenue' ? 'active' : ''}`}
                      onClick={() => setTopSortMode('revenue')}
                    >Doanh thu</button>
                    <button type="button"
                      className={`rp-top-toggle-btn ${topSortMode === 'qty' ? 'active' : ''}`}
                      onClick={() => setTopSortMode('qty')}
                    >Số lượng</button>
                  </div>
                </div>
                {topProducts.map((item, i) => (
                  <TopProductRow
                    key={`${item.productId}-${item.variantLabel}`}
                    rank={i} item={item}
                    maxVal={maxTopVal}
                    sortMode={topSortMode}
                  />
                ))}
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', marginTop: 12, textAlign: 'center' }}>
                  * Thống kê theo order detail (bao gồm cả variant sản phẩm)
                </p>
              </div>
            )}
          </div>

          {/* 5. BẢNG NGÀY */}
          {byDay.length > 0 && (
            <div className="rp-card">
              <p className="rp-sec"><Calendar size={12} /> Chi tiết từng ngày</p>
              <div style={{ overflowX: 'auto' }}>
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Doanh thu</th>
                      <th style={{ width: 120 }}>Biểu đồ</th>
                      <th>Số đơn</th>
                      <th>TB / đơn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byDay.map((row) => (
                      <tr key={row.date}>
                        <td style={{ color: '#475569', fontWeight: 500 }}>{row.date}</td>
                        <td className="rp-rev-cell">{fmt(row.revenue)}</td>
                        <td>
                          <span className="rp-mini-bar"
                            style={{ width: Math.max((row.revenue / maxDayRev) * 110, 2) + 'px' }}
                          />
                        </td>
                        <td style={{ color: '#64748b' }}>{row.orderCount} đơn</td>
                        <td style={{ color: '#475569' }}>
                          {row.orderCount > 0 ? fmt(Math.round(row.revenue / row.orderCount)) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* EMPTY */}
      {!loading && !error && !hasData && (
        <div className="rp-loading" style={{ flexDirection: 'column', gap: 8 }}>
          <Package size={44} style={{ opacity: .2 }} />
          <span>Không có dữ liệu trong khoảng thời gian này</span>
        </div>
      )}
    </div>
  )
}
