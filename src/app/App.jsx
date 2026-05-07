import { useState, useCallback } from "react";
import "@/styles/variables.css";
import "@/styles/globals.css";
import "@/styles/components.css";
import "@/styles/utilities.css";
import { AddHearingModal } from "@/features/calendar";
import { AddCaseModal } from "@/features/cases";
import { AddClientModal } from "@/features/clients";
import { UploadDocModal } from "@/features/documents";
import { AddExpenseModal } from "@/features/finance";
import { AddTaskModal } from "@/features/tasks";
import { DashboardLayout } from "@/layouts";
import { ACTIVITIES, CASES, CLIENTS, DOCS, EXPENSES, HEARINGS, TASKS } from "@/shared/data";
import AppProviders from "./providers";
import { appRoutes, getAppRoute } from "./routes";
// APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [clients, setClients] = useState(CLIENTS);
  const [cases, setCases] = useState(CASES);
  const [hearings, setHearings] = useState(HEARINGS);
  const [tasks, setTasks] = useState(TASKS);
  const [docs, setDocs] = useState(DOCS);
  const [expenses, setExpenses] = useState(EXPENSES);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [modal, setModal] = useState(null); // { type, data }
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const closeModal = () => setModal(null);

  const addClient = (data) => {
    const c = { ...data, id: Date.now(), activeCases: 0, totalFees: 0, paidFees: 0, lastActivity: new Date().toISOString().slice(0, 10), status: "active" };
    setClients(prev => [c, ...prev]);
    showToast("Client added successfully.");
  };

  const addCase = (data) => {
    const c = { ...data, id: Date.now(), hearings: 0, openDate: new Date().toISOString().slice(0, 10) };
    setCases(prev => [c, ...prev]);
    showToast("Case opened successfully.");
  };

  const addTask = (data) => {
    const t = { ...data, id: Date.now(), status: "todo" };
    setTasks(prev => [t, ...prev]);
    showToast("Task created.");
  };

  const moveTask = (id, status) => setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));

  const addHearing = (data) => {
    setHearings(prev => [{ ...data, id: Date.now(), status: "upcoming", outcome: "" }, ...prev]);
    showToast("Hearing scheduled.");
  };

  const routeContext = {
    clients,
    cases,
    hearings,
    tasks,
    docs,
    expenses,
    activities: ACTIVITIES,
    search,
    setSearch,
    selectedClient,
    selectedCase,
    setSelectedClient,
    setSelectedCase,
    moveTask,
  };
  const activeRoute = getAppRoute(page);
  const isDetailRoute = activeRoute.hasDetail?.(routeContext);
  const ActivePage = isDetailRoute ? activeRoute.detailComponent : activeRoute.component;
  const activePageProps = isDetailRoute
    ? activeRoute.getDetailProps(routeContext)
    : activeRoute.getProps(routeContext);

  return (
    <AppProviders>
      <DashboardLayout
        page={page}
        setPage={setPage}
        selectedClient={selectedClient}
        selectedCase={selectedCase}
        setSelectedClient={setSelectedClient}
        setSelectedCase={setSelectedCase}
        setModal={setModal}
        navItems={appRoutes}
        toast={toast}
        modals={(
          <>
            {modal?.type === "add-client" && <AddClientModal onClose={closeModal} onSave={addClient} />}
            {modal?.type === "add-case" && <AddCaseModal onClose={closeModal} onSave={addCase} clients={clients} />}
            {modal?.type === "add-task" && <AddTaskModal onClose={closeModal} onSave={addTask} cases={cases} />}
            {modal?.type === "add-hearing" && <AddHearingModal onClose={closeModal} onSave={addHearing} cases={cases} />}
            {modal?.type === "upload-doc" && <UploadDocModal onClose={closeModal} cases={cases} clients={clients} onSave={(d) => { setDocs(prev => [{ ...d, id: Date.now() }, ...prev]); showToast("Document uploaded."); }} />}
            {modal?.type === "add-expense" && <AddExpenseModal onClose={closeModal} clients={clients} cases={cases} onSave={(e) => { setExpenses(prev => [{ ...e, id: Date.now() }, ...prev]); showToast("Transaction recorded."); }} />}
          </>
        )}
      >
        <ActivePage {...activePageProps} />
      </DashboardLayout>
    </AppProviders>
  );
}

