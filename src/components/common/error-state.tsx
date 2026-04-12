interface ErrorStateProps {
  title: string;
  message: string;
}

export const ErrorState = ({ title, message }: ErrorStateProps) => (
  <section className="card empty-state">
    <h2>{title}</h2>
    <p>{message}</p>
  </section>
);
