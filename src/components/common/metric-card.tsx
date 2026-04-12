interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
}

export const MetricCard = ({ label, value, hint }: MetricCardProps) => (
  <article className="card metric-card">
    <p className="metric-label">{label}</p>
    <p className="metric-value">{value}</p>
    {hint ? <p className="metric-hint">{hint}</p> : null}
  </article>
);
