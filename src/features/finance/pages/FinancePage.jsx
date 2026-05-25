import { useEffect, useState } from "react";
import { StatCard, StatusBadge } from "@/components/ui";
import { fmtCurrency, fmtDate } from "@/shared/utils";

export default function FinancePage({ clients, expenses, cases }) {
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
        <StatCard label="Total Invoiced" value={fmtCurrency(totalInvoiced)} sub="All clients" isAmount />
        <StatCard label="Total Received" value={fmtCurrency(totalPaid)} sub="Payments collected" isAmount />
        <StatCard label="Outstanding" value={fmtCurrency(totalOwed)} sub="Pending collection" isAmount />
        <StatCard label="Collection Rate" value={`${collectionRate}%`} sub="Of total fees" />
      </div>

      <div className="card">
        <div className="tabs">
          {["overview", "transactions", "balances"].map(item => (
            <div key={item} className={`tab ${tab === item ? "active" : ""}`} onClick={() => setTab(item)}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </div>
          ))}
        </div>

        {tab === "overview" && (
          <div>
            <h4 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 16, marginBottom: 14 }}>Outstanding Balances by Client</h4>
            {clients.filter(client => client.totalFees > client.paidFees).map(client => {
              const pct = Math.round((client.paidFees / client.totalFees) * 100);
              return (
                <div key={client.id} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontWeight: 500 }}>{client.name}</span>
                    <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                      <span style={{ color: "var(--success)" }}>Paid: {fmtCurrency(client.paidFees)}</span>
                      <span style={{ color: "var(--danger)" }}>Due: {fmtCurrency(client.totalFees - client.paidFees)}</span>
                    </div>
                  </div>
                  <div className="balance-bar"><div className="balance-fill" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
            {clients.every(client => client.totalFees <= client.paidFees) && <div className="empty-state"><h3>No outstanding balances</h3></div>}
          </div>
        )}

        {tab === "transactions" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>PDF</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(transaction => {
                  const client = clients.find(item => item.id === transaction.clientId);
                  return (
                    <tr key={transaction.id}>
                      <td className="bold">{transaction.description}</td>
                      <td>{client?.name}</td>
                      <td><span className="badge badge-gold">{transaction.type}</span></td>
                      <td style={{ color: transaction.type === "payment" ? "var(--success)" : "var(--slate)", fontWeight: 600 }}>{fmtCurrency(transaction.amount)}</td>
                      <td style={{ fontSize: 12, color: "var(--muted)" }}>{fmtDate(transaction.date)}</td>
                      <td>{transaction.status ? <StatusBadge status={transaction.status} /> : "—"}</td>
                      <td>
                        {transaction.type === "invoice" ? (
                          <button className="btn btn-ghost btn-sm" onClick={() => setPrintTransaction(transaction)}>Export</button>
                        ) : (
                          <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {expenses.length === 0 && <div className="empty-state"><h3>No transactions yet</h3></div>}
          </div>
        )}

        {tab === "balances" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Client</th><th>Total Billed</th><th>Paid</th><th>Outstanding</th><th>Status</th></tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id}>
                    <td className="bold">{client.name}</td>
                    <td>{fmtCurrency(client.totalFees)}</td>
                    <td style={{ color: "var(--success)" }}>{fmtCurrency(client.paidFees)}</td>
                    <td style={{ color: client.totalFees > client.paidFees ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>
                      {client.totalFees > client.paidFees ? fmtCurrency(client.totalFees - client.paidFees) : "—"}
                    </td>
                    <td>{client.totalFees > client.paidFees ? <StatusBadge status="pending" /> : <StatusBadge status="active" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {clients.length === 0 && <div className="empty-state"><h3>No balances yet</h3></div>}
          </div>
        )}
      </div>

      {printTransaction && (
        <section className="invoice-print-area" aria-hidden="true">
          <div className="invoice-paper">
            <header className="invoice-header">
              <div>
                <span className="invoice-kicker">Cabinet Aït El Hadj Avocat</span>
                <h1>Facture</h1>
                <p>Rigueur. Confidentialité. Excellence.</p>
              </div>
              <div className="invoice-number">
                <strong>{invoiceNumber}</strong>
                <span>{printTransaction.status || "outstanding"}</span>
              </div>
            </header>

            <div className="invoice-meta-grid">
              <div>
                <h4>Facturé à</h4>
                <strong>{printClient?.name || "Client"}</strong>
                <span>{printClient?.email || "—"}</span>
                <span>{printClient?.phone || "—"}</span>
                <span>{printClient?.address || "—"}</span>
              </div>
              <div>
                <h4>Dossier</h4>
                <strong>{printCase?.caseNumber || "Non lié"}</strong>
                <span>{printCase?.title || "—"}</span>
                <span>{printCase?.court || "—"}</span>
              </div>
              <div>
                <h4>Détails</h4>
                <span>Date : {fmtDate(printTransaction.date)}</span>
                <span>Type : {printTransaction.type}</span>
                <span>Statut : {printTransaction.status || "—"}</span>
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantité</th>
                  <th>Prix</th>
                  <th>Total</th>
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
              <div><span>Sous-total</span><strong>{fmtCurrency(subtotal)}</strong></div>
              <div><span>Taxe</span><strong>{fmtCurrency(tax)}</strong></div>
              <div className="invoice-grand-total"><span>Total</span><strong>{fmtCurrency(total)}</strong></div>
            </div>

            <footer className="invoice-footer">
              <div>
                <strong>Conditions</strong>
                <span>Merci de procéder au règlement selon les conditions convenues avec le cabinet.</span>
              </div>
              <div>
                <strong>Cabinet Aït El Hadj</strong>
                <span>Document généré automatiquement depuis l’application de gestion du cabinet.</span>
              </div>
            </footer>
          </div>
        </section>
      )}
    </div>
  );
}
