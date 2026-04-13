import { createBrowserRouter } from "react-router-dom";

import { ErrorState } from "../components/common/error-state";
import { AppShell } from "../components/layout/app-shell";
import { AddEntryPage } from "../pages/AddEntryPage";
import { BudgetPage } from "../pages/BudgetPage";
import { ClubsPage } from "../pages/ClubsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { EditClubPage } from "../pages/EditClubPage";
import { EditEntryPage } from "../pages/EditEntryPage";
import { HistoryPage } from "../pages/HistoryPage";
import { SummariesPage } from "../pages/SummariesPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: (
      <ErrorState title="Route error" message="The requested page could not be loaded." />
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "add", element: <AddEntryPage /> },
      { path: "budget", element: <BudgetPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "clubs", element: <ClubsPage /> },
      { path: "clubs/:clubId/edit", element: <EditClubPage /> },
      { path: "summaries", element: <SummariesPage /> },
      { path: "entries/:entryId/edit", element: <EditEntryPage /> },
    ],
  },
]);
