import { Navigate, useNavigate, useParams } from "react-router-dom";

import { useAppData } from "../app/providers";
import { ClubForm } from "../components/forms/club-form";

export const EditClubPage = () => {
  const navigate = useNavigate();
  const { clubId = "" } = useParams();
  const { clubs, updateClub } = useAppData();

  const club = clubs.find((candidate) => candidate.id === clubId);

  if (!club) {
    return <Navigate to="/clubs" replace />;
  }

  return (
    <div className="page-stack">
      <section className="card">
        <div className="section-heading">
          <h2>Edit club</h2>
          <p className="subtle">Changing club details does not rewrite past flight pricing snapshots.</p>
        </div>
        <ClubForm
          initialValue={club}
          submitLabel="Update club"
          onSubmit={async (value) => {
            await updateClub(value as typeof club);
            await navigate("/clubs");
          }}
        />
      </section>
    </div>
  );
};
