import { useEffect, useState } from "react";
import { StatCard, StatusBadge } from "@/components/ui";
import { useI18n } from "@/i18n";
import { fmtCurrency, fmtDate } from "@/shared/utils";

const tabKeys = ["overview", "transactions", "balances"];

export default function FinancePage({ clients, expenses, cases }) {
  const { t } = useI18n();
  const [tab, setTab] = useState("overview");
  const [printTransaction, setPrintTransaction] = useState(null);
  const totalInvoiced = clients.reduce((sum, client) => sum + client.totalFees, 0);
  const totalPaid = clients.reduce((sum, client) => sum + client.paidFees, 0);
  const totalOwed = totalInvoiced - totalPaid;
  const collectionRate = totalInvoiced === 0 ? 0 : Math.round((totalPaid / totalInvoiced) * 100);

  const printClient = printTransaction ? clients.find(client => client.id === printTransaction.clientId) : null;
  const printCase = printTransaction ? cases.find(caseItem => caseItem.id === printTransaction.caseId) : null;
  const invoiceNumber = printTransaction ? `INV-${String(printTransaction.id).padStart(5, "0")}` : "";
  const subtotal = printTransaction?.amount || 0;
  const tax = 0;
  const total = subtotal + tax;

  useEffect(() => {
    const cleanup = () => {
      document.body.classList.remove("printing-invoice");
      setPrintTransaction(null);
      window.removeEventListener("afterprint", cleanup);
    };

    if (!printTransaction) return undefined;

    document.body.classList.add("printing-invoice");
    window.addEventListener("afterprint", cleanup);
    const timer = window.setTimeout(() => window.print(), 80);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", cleanup);
      document.body.classList.remove("printing-invoice");
    };
  }, [printTransaction]);

  return (
    <div className="finance-page">
      <div className="stats-grid mb-6">
        <StatCard label={t("ui.totalInvoiced")} value={fmtCurrency(totalInvoiced)} sub={t("ui.allClients")} isAmount />
        <StatCard label={t("ui.totalReceived")} value={fmtCurrency(totalPaid)} sub={t("ui.paymentsCollected")} isAmount />
        <StatCard label={t("ui.outstanding")} value={fmtCurrency(totalOwed)} sub={t("ui.pendingCollection")} isAmount />
        <StatCard label={t("ui.collectionRate")} value={`${collectionRate}%`} sub={t("ui.ofTotalFees")} />
      </div>

      <div className="card">
        <div className="tabs">
          {tabKeys.map(item => (
            <div key={item} className={`tab ${tab === item ? "active" : ""}`} onClick={() => setTab(item)}>
              {t(`ui.${item}`)}
            </div>
          ))}
        </div>

        {tab === "overview" && (
          <div>
            <h4 style={{ fontFamily: "var(--font-heading)", fontSize: 16, marginBottom: 14 }}>{t("ui.outstandingByClient")}</h4>
            {clients.filter(client => client.totalFees > client.paidFees).map(client => {
              const pct = Math.round((client.paidFees / client.totalFees) * 100);
              return (
                <div key={client.id} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, gap: 12 }}>
                    <span style={{ fontWeight: 500 }}>{client.name}</span>
                    <div style={{ display: "flex", gap: 16, fontSize: 12, flexWrap: "wrap" }}>
                      <span style={{ color: "var(--success)" }}>{t("ui.paid")}: {fmtCurrency(client.paidFees)}</span>
                      <span style={{ color: "var(--danger)" }}>{t("ui.due")}: {fmtCurrency(client.totalFees - client.paidFees)}</span>
                    </div>
                  </div>
                  <div className="balance-bar"><div className="balance-fill" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
            {clients.every(client => client.totalFees <= client.paidFees) && <div className="empty-state"><h3>{t("ui.noOutstandingBalances")}</h3></div>}
          </div>
        )}

        {tab === "transactions" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("ui.description")}</th>
                  <th>{t("ui.client")}</th>
                  <th>{t("ui.type")}</th>
                  <th>{t("ui.amount")}</th>
                  <th>{t("ui.date")}</th>
                  <th>{t("ui.status")}</th>
                  <th>{t("ui.pdf")}</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(transaction => {
                  const client = clients.find(item => item.id === transaction.clientId);
                  return (
                    <tr key={transaction.id}>
                      <td className="bold">{transaction.description}</td>
                      <td>{client?.name}</td>
                      <td><span className="badge badge-gold">{t(`status.${transaction.type}`, transaction.type)}</span></td>
                      <td style={{ color: transaction.type === "payment" ? "var(--success)" : "var(--slate)", fontWeight: 600 }}>{fmtCurrency(transaction.amount)}</td>
                      <td style={{ fontSize: 12, color: "var(--muted)" }}>{fmtDate(transaction.date)}</td>
                      <td>{transaction.status ? <StatusBadge status={transaction.status} /> : "-"}</td>
                      <td>
                        {transaction.type === "invoice" ? (
                          <button className="btn btn-ghost btn-sm" onClick={() => setPrintTransaction(transaction)}>{t("ui.export")}</button>
                        ) : (
                          <span style={{ color: "var(--muted)", fontSize: 12 }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {expenses.length === 0 && <div className="empty-state"><h3>{t("ui.noTransactionsYet")}</h3></div>}
          </div>
        )}

        {tab === "balances" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>{t("ui.client")}</th><th>{t("ui.totalBilled")}</th><th>{t("ui.paid")}</th><th>{t("ui.outstanding")}</th><th>{t("ui.status")}</th></tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id}>
                    <td className="bold">{client.name}</td>
                    <td>{fmtCurrency(client.totalFees)}</td>
                    <td style={{ color: "var(--success)" }}>{fmtCurrency(client.paidFees)}</td>
                    <td style={{ color: client.totalFees > client.paidFees ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>
                      {client.totalFees > client.paidFees ? fmtCurrency(client.totalFees - client.paidFees) : "-"}
                    </td>
                    <td>{client.totalFees > client.paidFees ? <StatusBadge status="pending" /> : <StatusBadge status="active" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {clients.length === 0 && <div className="empty-state"><h3>{t("ui.noBalancesYet")}</h3></div>}
          </div>
        )}
      </div>

      {printTransaction && (
        <section className="invoice-print-area" aria-hidden="true">
          <div className="invoice-paper">
            <header className="invoice-header">
              <div>
                <span className="invoice-kicker">{t("auth.footerFirm")}</span>
                <h1>{t("ui.invoice")}</h1>
                <p>{t("auth.footerValues")}</p>
              </div>
              <div className="invoice-number">
                <strong>{invoiceNumber}</strong>
                <span>{t(`status.${printTransaction.status || "outstanding"}`, printTransaction.status || "outstanding")}</span>
              </div>
            </header>

            <div className="invoice-meta-grid">
              <div>
                <h4>{t("ui.billedTo")}</h4>
                <strong>{printClient?.name || t("ui.client")}</strong>
                <span>{printClient?.email || "-"}</span>
                <span>{printClient?.phone || "-"}</span>
                <span>{printClient?.address || "-"}</span>
              </div>
              <div>
                <h4>{t("ui.case")}</h4>
                <strong>{printCase?.caseNumber || t("ui.noLinkedCase")}</strong>
                <span>{printCase?.title || "-"}</span>
                <span>{printCase?.court || "-"}</span>
              </div>
              <div>
                <h4>{t("ui.details")}</h4>
                <span>{t("ui.date")}: {fmtDate(printTransaction.date)}</span>
                <span>{t("ui.type")}: {t(`status.${printTransaction.type}`, printTransaction.type)}</span>
                <span>{t("ui.status")}: {printTransaction.status ? t(`status.${printTransaction.status}`, printTransaction.status) : "-"}</span>
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>{t("ui.description")}</th>
                  <th>{t("ui.quantity")}</th>
                  <th>{t("ui.price")}</th>
                  <th>{t("ui.total")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{printTransaction.description}</td>
                  <td>1</td>
                  <td>{fmtCurrency(subtotal)}</td>
                  <td>{fmtCurrency(subtotal)}</td>
                </tr>
              </tbody>
            </table>

            <div className="invoice-total-box">
              <div><span>{t("ui.subtotal")}</span><strong>{fmtCurrency(subtotal)}</strong></div>
              <div><span>{t("ui.tax")}</span><strong>{fmtCurrency(tax)}</strong></div>
              <div className="invoice-grand-total"><span>{t("ui.total")}</span><strong>{fmtCurrency(total)}</strong></div>
            </div>

            <footer className="invoice-footer">
              <div>
                <strong>{t("ui.terms")}</strong>
                <span>{t("ui.invoiceTerms")}</span>
              </div>
              <div>
                <strong>{t("auth.footerFirm")}</strong>
                <span>{t("ui.generatedDocument")}</span>
              </div>
            </footer>
          </div>
        </section>
      )}
    </div>
  );
}
