const labels = {
  clients: "Clients",
  cases: "Cases",
  tasks: "Tasks",
  hearings: "Hearings",
  documents: "Documents",
  finance: "Finance",
  notes: "Notes",
  team: "Team",
};

export default function RouteDataBoundary({ required, states, children }) {
  const entries = required.map(key => ({ key, state: states[key] }));
  const unresolved = entries.filter(({ state }) => state && !state.loaded && !state.error);
  const failures = entries.filter(({ state }) => state?.error);

  if (entries.length > 0 && unresolved.length === entries.length) {
    return <div className="empty-state"><h3>Loading...</h3></div>;
  }

  return (
    <>
      {failures.map(({ key, state }) => (
        <div className="auth-error" key={key} style={{ marginBottom: 12 }}>
          <strong>{labels[key] || key}:</strong> {state.error}
        </div>
      ))}
      {children}
    </>
  );
}
