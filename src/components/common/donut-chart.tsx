import { formatCurrency } from "../../lib/formatters";

interface DonutChartSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title: string;
  totalLabel: string;
  segments: DonutChartSegment[];
}

export const DonutChart = ({ title, totalLabel, segments }: DonutChartProps) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let start = 0;
  const gradientParts = segments.map((segment) => {
    const percentage = total > 0 ? (segment.value / total) * 100 : 0;
    const end = start + percentage;
    const part = `${segment.color} ${start}% ${end}%`;
    start = end;
    return part;
  });

  const background =
    total > 0
      ? `conic-gradient(${gradientParts.join(", ")})`
      : "conic-gradient(#e2e8f0 0% 100%)";

  return (
    <article className="card chart-card">
      <div className="section-heading">
        <h3>{title}</h3>
        <p className="subtle">{totalLabel}</p>
      </div>
      <div className="donut-layout">
        <div className="donut-shell" style={{ background }}>
          <div className="donut-hole">
            <strong>{formatCurrency(total)}</strong>
          </div>
        </div>
        <div className="donut-legend">
          {segments.map((segment) => (
            <div key={segment.label} className="legend-row">
              <span className="legend-label">
                <span
                  className="legend-swatch"
                  style={{ backgroundColor: segment.color }}
                />
                {segment.label}
              </span>
              <strong>{formatCurrency(segment.value)}</strong>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
};
