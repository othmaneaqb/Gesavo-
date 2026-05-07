import { StatusBadge } from "@/components/ui";
import { I } from "@/shared/constants";
import { fmtDate } from "@/shared/utils";

export default function CasesPage({ cases, clients, search, setSearch, onSelect }) {
  const getClient = id => clients.find(c => c.id === id);
  const filtered = cases.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.court.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div className="search-bar">
          <span className="search-icon">{I.search}</span>
          <input placeholder="Search by title, case number, court…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Case</th>
                <th>Client</th>
                <th>Type</th>
                <th>Court</th>
                <th>Judge</th>
                <th>Next Hearing</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const client = getClient(c.clientId);
                return (
                  <tr key={c.id} onClick={() => onSelect(c)}>
                    <td>
                      <div className="bold">{c.title}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.caseNumber}</div>
                    </td>
                    <td>{client?.name}</td>
                    <td><span className={`badge badge-${c.type}`}>{c.type}</span></td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{c.court}</td>
                    <td style={{ fontSize: 12 }}>{c.judge}</td>
                    <td style={{ fontSize: 12, color: "var(--gold)" }}>{fmtDate(c.nextHearing)}</td>
                    <td><StatusBadge status={c.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
