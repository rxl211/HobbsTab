import { useState } from "react";

interface LineChartPoint {
  id: string;
  label: string;
  sublabel: string;
  valueLabel: string;
  value: number;
}

interface LineChartProps {
  title: string;
  subtitle: string;
  points: LineChartPoint[];
  emptyMessage: string;
}

const chartWidth = 640;
const chartHeight = 220;
const padding = 24;
const centerY = chartHeight / 2;

const computeYBounds = (values: number[]) => {
  if (values.length === 0) {
    return { minBound: 0, maxBound: 1 };
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  if (minValue === maxValue) {
    return {
      minBound: minValue - 1,
      maxBound: maxValue + 1,
    };
  }

  const range = maxValue - minValue;
  const paddingBelow = range * 0.75;
  const paddingAbove = range * 1.75;

  return {
    minBound: Math.max(0, minValue - paddingBelow),
    maxBound: maxValue + paddingAbove,
  };
};

export const LineChart = ({
  title,
  subtitle,
  points,
  emptyMessage,
}: LineChartProps) => {
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const values = points.map((point) => point.value);
  const { minBound, maxBound } = computeYBounds(values);
  const range = maxBound - minBound || 1;
  const usableWidth = chartWidth - padding * 2;
  const usableHeight = chartHeight - padding * 2;

  const chartPoints = points.map((point, index) => {
    const x =
      points.length === 1
        ? chartWidth / 2
        : padding + (index / (points.length - 1)) * usableWidth;
    const y =
      points.length === 1
        ? centerY
        : padding + usableHeight - ((point.value - minBound) / range) * usableHeight;

    return { ...point, x, y };
  });

  const pathData = chartPoints.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const previous = chartPoints[index - 1];
    return `${path} L ${point.x} ${previous.y} L ${point.x} ${point.y}`;
  }, "");

  const firstPoint = chartPoints[0];
  const lastPoint = chartPoints[chartPoints.length - 1];
  const hoveredPoint = chartPoints.find((point) => point.id === hoveredPointId) ?? null;

  return (
    <article className="card">
      <div className="section-heading">
        <h3>{title}</h3>
        <p className="subtle">{subtitle}</p>
      </div>
      {points.length === 0 ? (
        <p className="subtle">{emptyMessage}</p>
      ) : (
        <div className="line-chart-layout">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="line-chart"
            role="img"
            aria-label={title}
          >
            <line
              x1={padding}
              y1={chartHeight - padding}
              x2={chartWidth - padding}
              y2={chartHeight - padding}
              className="line-chart-axis"
            />
            <line
              x1={padding}
              y1={padding}
              x2={padding}
              y2={chartHeight - padding}
              className="line-chart-axis"
            />
            <path d={pathData} className="line-chart-path" />
            {chartPoints.map((point) => (
              <g key={point.id}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="14"
                  className="line-chart-hit-area"
                  onMouseEnter={() => setHoveredPointId(point.id)}
                  onMouseLeave={() =>
                    setHoveredPointId((current) => (current === point.id ? null : current))
                  }
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  className="line-chart-dot"
                  onMouseEnter={() => setHoveredPointId(point.id)}
                  onMouseLeave={() =>
                    setHoveredPointId((current) => (current === point.id ? null : current))
                  }
                />
              </g>
            ))}
            {firstPoint ? (
              <text
                x={firstPoint.x}
                y={chartHeight - 4}
                textAnchor="start"
                className="line-chart-label"
              >
                {firstPoint.label}
              </text>
            ) : null}
            {lastPoint && lastPoint.id !== firstPoint?.id ? (
              <text
                x={lastPoint.x}
                y={chartHeight - 4}
                textAnchor="end"
                className="line-chart-label"
              >
                {lastPoint.label}
              </text>
            ) : null}
            {lastPoint ? (
              <text
                x={Math.min(lastPoint.x + 8, chartWidth - padding - 8)}
                y={Math.max(lastPoint.y - 10, padding + 10)}
                textAnchor="end"
                className="line-chart-value"
              >
                {lastPoint.valueLabel}
              </text>
            ) : null}
            {hoveredPoint ? (
              <foreignObject
                x={Math.max(8, Math.min(hoveredPoint.x - 78, chartWidth - 164))}
                y={Math.max(8, hoveredPoint.y - 84)}
                width="156"
                height="72"
                className="line-chart-tooltip-object"
              >
                <div className="line-chart-tooltip">
                  <strong>{hoveredPoint.valueLabel}</strong>
                  <span>{hoveredPoint.label}</span>
                </div>
              </foreignObject>
            ) : null}
          </svg>
          <div className="chart-summary-grid">
            <div className="chart-summary-card">
              <p className="metric-label">Started</p>
              <strong>{points[0]?.valueLabel ?? "—"}</strong>
              <p className="subtle">{points[0]?.label ?? ""}</p>
            </div>
            <div className="chart-summary-card">
              <p className="metric-label">Latest</p>
              <strong>{lastPoint?.valueLabel ?? "—"}</strong>
              <p className="subtle">{lastPoint?.label ?? ""}</p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
