import { NavLink, Outlet } from "react-router-dom";

import { AppDataProvider, useAppData } from "../../app/providers";

const navigation = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/add", label: "Add Entry" },
  { to: "/history", label: "History" },
  { to: "/clubs", label: "Clubs" },
];

const ShellFrame = () => {
  const { error } = useAppData();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">GENERAL AVIATION COST TRACKER</p>
          <h1>HobbsTab</h1>
        </div>
        <nav className="topnav" aria-label="Primary">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {error ? <div className="banner error-banner">{error}</div> : null}

      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
};

export const AppShell = () => (
  <AppDataProvider>
    <ShellFrame />
  </AppDataProvider>
);
