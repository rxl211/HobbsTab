import { useAppData } from "../app/providers";
import { HistoryList } from "../components/common/history-list";

export const HistoryPage = () => {
  const { historyRows, loading, removeEntry } = useAppData();

  return (
    <div className="page-stack">
      {loading ? <section className="card">Loading…</section> : null}
      <HistoryList rows={historyRows} onDeleteEntry={removeEntry} />
    </div>
  );
};
