import { StatusBadge } from "@/components/ui";
import { useI18n } from "@/i18n";
import { I } from "@/shared/constants";
import { fmtDate } from "@/shared/utils";

export default function CasesPage({ cases, clients, search, setSearch, onSelect }) {
  const { t } = useI18n();
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
          <input placeholder={t("ui.searchCases")} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("ui.case")}</th>
                <th>{t("ui.client")}</th>
                <th>{t("ui.type")}</th>
                <th>{t("ui.court")}</th>
                <th>{t("ui.judge")}</th>
                <th>{t("ui.nextHearing")}</th>
                <th>{t("ui.status")}</th>
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
                    <td><span className={`badge badge-${c.type}`}>{t(`status.${c.type}`, c.type)}</span></td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{c.court}</td>
                    <td style={{ fontSize: 12 }}>{c.judge}</td>
                    <td style={{ fontSize: 12, color: "var(--gold)" }}>{fmtDate(c.nextHearing)}</td>
                    <td><StatusBadge status={c.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="empty-state"><h3>{t("ui.noCasesFound")}</h3><p>{t("ui.createCaseHint")}</p></div>}
        </div>
      </div>
    </div>
  );
}
