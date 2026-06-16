import "./DashboardDonutChart.css";

export type DonutSegment = { label: string; value: number; color: string };

type DashboardDonutChartProps = {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
};

function DashboardDonutChart({
  segments,
  size = 200,
  strokeWidth = 28,
}: DashboardDonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div className="dashboard__donut-empty">
        <span>Aucune donnée</span>
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2 - 2;
  const rInner = r - strokeWidth;
  const paths = segments.map((seg, index) => {
    const priorTotal = segments
      .slice(0, index)
      .reduce((sum, item) => sum + item.value, 0);
    const startRatio = priorTotal / total;
    const endRatio = (priorTotal + seg.value) / total;
    const ratio = seg.value / total;
    const startAngle = (startRatio * 360 - 90) * (Math.PI / 180);
    const endAngle = (endRatio * 360 - 90) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const x3 = cx + rInner * Math.cos(endAngle);
    const y3 = cy + rInner * Math.sin(endAngle);
    const x4 = cx + rInner * Math.cos(startAngle);
    const y4 = cy + rInner * Math.sin(startAngle);
    const large = ratio > 0.5 ? 1 : 0;
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
    return { ...seg, path };
  });

  return (
    <div className="dashboard__donut-wrap">
      <svg
        className="dashboard__donut-svg"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        aria-hidden
      >
        {paths.map((seg, i) => (
          <path
            key={i}
            d={seg.path}
            fill={seg.color}
            className="dashboard__donut-segment"
          />
        ))}
        <circle
          cx={cx}
          cy={cy}
          r={rInner}
          fill="var(--surface)"
          aria-hidden
        />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="dashboard__donut-total"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          className="dashboard__donut-total-label"
        >
          total
        </text>
      </svg>
      <ul className="dashboard__donut-legend">
        {segments.map((seg, i) => (
          <li key={i} className="dashboard__donut-legend-item">
            <span
              className="dashboard__donut-legend-dot"
              style={{ background: seg.color }}
              aria-hidden
            />
            <span className="dashboard__donut-legend-label">{seg.label}</span>
            <span className="dashboard__donut-legend-value">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DashboardDonutChart;
