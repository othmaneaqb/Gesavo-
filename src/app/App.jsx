import { useState, useCallback, useEffect, useMemo } from "react";
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
import { LoginPage, ResetPasswordPage } from "@/features/auth";
import { DashboardLayout } from "@/layouts";
import { authService } from "@/services/auth.service";
import { clientsService } from "@/services/clients.service";
import { casesService } from "@/services/cases.service";
import { tasksService } from "@/services/tasks.service";
import { hearingsService } from "@/services/hearings.service";
import { documentsService } from "@/services/documents.service";
import { financeService } from "@/services/finance.service";
import { notesService } from "@/services/notes.service";
import { usersService } from "@/services/users.service";
import AppProviders from "./providers";
import { I18nProvider } from "@/i18n";
import { appRoutes } from "./routes";
// APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [clients, setClients] = useState([]);
  const [clientsState, setClientsState] = useState({ loading: true, error: null, source: "api" });
  const [cases, setCases] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [docs, setDocs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [modal, setModal] = useState(null); // { type, data }
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [authState, setAuthState] = useState({
    loading: true,
    user: null,
    error: null,
  });

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const closeModal = () => setModal(null);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        if (isMounted) setAuthState({ loading: false, user: null, error: null });
        return;
      }

      try {
        const user = await authService.getProfile();
        if (isMounted) setAuthState({ loading: false, user, error: null });
      } catch {
        authService.logout();
        if (isMounted) setAuthState({ loading: false, user: null, error: null });
      }
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authState.user) {
      setClients([]);
      setCases([]);
      setHearings([]);
      setTasks([]);
      setDocs([]);
      setExpenses([]);
      setNotes([]);
      setClientsState({ loading: false, error: null, source: "api" });
      return;
    }

    let isMounted = true;

    const loadClients = async () => {
      try {
        setClientsState({ loading: true, error: null, source: "api" });
        const canViewFinance = authState.user.role === "LAWYER";
        const [clientData, caseData, hearingData, taskData, docData, noteData, expenseData] = await Promise.all([
          clientsService.getAll(),
          casesService.getAll(),
          hearingsService.getAll(),
          tasksService.getAll(),
          documentsService.getAll(),
          notesService.getAll(),
          canViewFinance ? financeService.getAll() : Promise.resolve([]),
        ]);
        if (!isMounted) return;
        const totals = expenseData.reduce((map, item) => {
          const current = map[item.clientId] || { totalFees: 0, paidFees: 0 };
          if (item.type === "invoice") current.totalFees += item.amount;
          if (item.type === "payment") current.paidFees += item.amount;
          map[item.clientId] = current;
          return map;
        }, {});
        const activeCaseCounts = caseData.reduce((map, item) => {
          if (item.status === "active" || item.status === "urgent") {
            map[item.clientId] = (map[item.clientId] || 0) + 1;
          }
          return map;
        }, {});
        setClients(clientData.map(client => ({ ...client, ...(totals[client.id] || {}), activeCases: activeCaseCounts[client.id] || 0 })));
        setCases(caseData);
        setHearings(hearingData);
        setTasks(taskData);
        setDocs(docData);
        setExpenses(expenseData);
        setNotes(noteData);
        setClientsState({ loading: false, error: null, source: "api" });
      } catch (error) {
        if (!isMounted) return;
        const status = error.response?.status;
        const message = status === 401
          ? "Clients API requires login before data can be loaded."
          : "Could not load clients from the backend.";
        setClientsState({ loading: false, error: message, source: "api" });
      }
    };

    loadClients();
    return () => {
      isMounted = false;
    };
  }, [authState.user]);

  const login = async (username, password) => {
    try {
      setAuthState(prev => ({ ...prev, error: null }));
      await authService.login(username, password);
      const user = await authService.getProfile();
      setAuthState({ loading: false, user, error: null });
    } catch {
      setAuthState({ loading: false, user: null, error: "auth.invalidCredentials" });
    }
  };

  const logout = () => {
    authService.logout();
    setAuthState({ loading: false, user: null, error: null });
    setSelectedClient(null);
    setSelectedCase(null);
    showToast("Logged out.");
  };

  const addClient = async (data) => {
    try {
      const client = await clientsService.create(data);
      setClients(prev => [client, ...prev]);
      showToast("Client added successfully.");
      return true;
    } catch (error) {
      const status = error.response?.status;
      showToast(status === 401 ? "Please log in before adding clients." : "Could not add client.");
      return false;
    }
  };

  const updateClient = async (id, data) => {
    try {
      const client = await clientsService.update(id, data);
      setClients(prev => prev.map(item => item.id === id ? { ...item, ...client } : item));
      setSelectedClient(prev => prev?.id === id ? { ...prev, ...client } : prev);
      showToast("Client updated successfully.");
      return true;
    } catch {
      showToast("Could not update client.");
      return false;
    }
  };

  const deleteClient = async (id) => {
    const confirmed = window.confirm("Delete this client? This will also remove related backend records.");
    if (!confirmed) return false;

    try {
      await clientsService.delete(id);
      setClients(prev => prev.filter(client => client.id !== id));
      setSelectedClient(null);
      showToast("Client deleted.");
      return true;
    } catch {
      showToast("Could not delete client.");
      return false;
    }
  };

  const addCase = (data) => {
    return casesService.create(data)
      .then(c => {
        setCases(prev => [c, ...prev]);
        showToast("Case opened successfully.");
        return true;
      })
      .catch(() => {
        showToast("Could not open case.");
        return false;
      });
  };

  const updateCase = async (id, data) => {
    try {
      const caseItem = await casesService.update(id, data);
      setCases(prev => prev.map(item => item.id === id ? caseItem : item));
      setSelectedCase(prev => prev?.id === id ? caseItem : prev);
      showToast("Case updated successfully.");
      return true;
    } catch {
      showToast("Could not update case.");
      return false;
    }
  };

  const deleteCase = async (id) => {
    const confirmed = window.confirm("Delete this case? This will also remove related backend records.");
    if (!confirmed) return false;

    try {
      await casesService.delete(id);
      setCases(prev => prev.filter(item => item.id !== id));
      setSelectedCase(null);
      showToast("Case deleted.");
      return true;
    } catch {
      showToast("Could not delete case.");
      return false;
    }
  };

  const addTask = async (data) => {
    try {
      const task = await tasksService.create(data);
      setTasks(prev => [task, ...prev]);
      showToast("Task created.");
      return true;
    } catch {
      showToast("Could not create task.");
      return false;
    }
  };

  const moveTask = async (id, status) => {
    try {
      const updated = await tasksService.updateStatus(id, status);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    } catch {
      showToast("Could not update task.");
    }
  };

  const restoreTask = async (id) => {
    try {
      const restored = await tasksService.restore(id);
      setTasks(prev => prev.map(task => task.id === id ? restored : task));
      showToast("Task restored.");
    } catch {
      showToast("Could not restore task.");
    }
  };

  const addHearing = async (data) => {
    try {
      const hearing = await hearingsService.create(data);
      setHearings(prev => [hearing, ...prev]);
      showToast("Hearing scheduled.");
      return true;
    } catch {
      showToast("Could not schedule hearing.");
      return false;
    }
  };

  const addDocument = async (data) => {
    try {
      const document = await documentsService.create(data);
      setDocs(prev => [document, ...prev]);
      showToast("Document uploaded.");
      return true;
    } catch {
      showToast("Could not upload document.");
      return false;
    }
  };

  const addExpense = async (data) => {
    try {
      const transaction = await financeService.create(data);
      setExpenses(prev => [transaction, ...prev]);
      setClients(prev => prev.map(client => client.id === transaction.clientId
        ? {
            ...client,
            totalFees: client.totalFees + (transaction.type === "invoice" ? transaction.amount : 0),
            paidFees: client.paidFees + (transaction.type === "payment" ? transaction.amount : 0),
          }
        : client));
      showToast("Transaction recorded.");
      return true;
    } catch {
      showToast("Could not record transaction.");
      return false;
    }
  };

  const addNote = async (data) => {
    const note = await notesService.create(data);
    setNotes(prev => [note, ...prev]);
    return note;
  };

  const activities = [
    ...docs.slice(0, 2).map(doc => ({
      id: `doc-${doc.id}`,
      text: `Document uploaded: ${doc.name}`,
      time: "Recent",
      type: "doc",
    })),
    ...notes.slice(0, 2).map(note => ({
      id: `note-${note.id}`,
      text: `Note added: ${note.title}`,
      time: "Recent",
      type: "note",
    })),
    ...expenses.slice(0, 2).map(item => ({
      id: `finance-${item.id}`,
      text: `${item.type === "payment" ? "Payment received" : "Transaction recorded"}: ${item.description}`,
      time: "Recent",
      type: item.type,
    })),
  ].slice(0, 5);

  const notifications = useMemo(() => {
    if (!authState.user) return [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inSevenDays = new Date(startOfToday);
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    const toDate = value => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const taskAlerts = tasks
      .filter(task => !task.isArchived && task.status !== "done" && task.deadline)
      .map(task => {
        const deadline = toDate(task.deadline);
        if (!deadline) return null;
        const caseItem = cases.find(item => item.id === task.caseId);
        const isOverdue = deadline < startOfToday;
        const isDueSoon = deadline <= inSevenDays;
        if (!isOverdue && !isDueSoon && task.priority !== "urgent") return null;
        return {
          id: `task-${task.id}`,
          type: isOverdue ? "danger" : task.priority === "urgent" ? "warning" : "info",
          title: isOverdue ? "Tâche en retard" : task.priority === "urgent" ? "Tâche urgente" : "Tâche proche",
          message: `${task.title}${caseItem ? ` · ${caseItem.caseNumber}` : ""}`,
          date: task.deadline,
          page: "tasks",
        };
      })
      .filter(Boolean);

    const hearingAlerts = hearings
      .filter(hearing => hearing.status === "upcoming")
      .map(hearing => {
        const hearingDate = toDate(hearing.date);
        if (!hearingDate || hearingDate < startOfToday || hearingDate > inSevenDays) return null;
        const caseItem = cases.find(item => item.id === hearing.caseId);
        return {
          id: `hearing-${hearing.id}`,
          type: "gold",
          title: "Audience à venir",
          message: `${hearing.title}${caseItem ? ` · ${caseItem.caseNumber}` : ""}`,
          date: hearing.date,
          page: "calendar",
        };
      })
      .filter(Boolean);

    const documentAlerts = docs
      .filter(doc => {
        const uploadedAt = toDate(doc.date);
        if (!uploadedAt) return false;
        const diffMs = now - uploadedAt;
        return diffMs >= 0 && diffMs <= 1000 * 60 * 60 * 24 * 3;
      })
      .slice(0, 4)
      .map(doc => ({
        id: `doc-${doc.id}`,
        type: "info",
        title: "Document récent",
        message: doc.name,
        date: doc.date,
        page: "documents",
      }));

    return [...taskAlerts, ...hearingAlerts, ...documentAlerts]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 12);
  }, [authState.user, tasks, hearings, docs, cases]);

  const updateNote = async (id, data) => {
    const note = await notesService.update(id, data);
    setNotes(prev => prev.map(item => item.id === id ? note : item));
    return note;
  };

  const routeContext = {
    clients,
    clientsState,
    cases,
    hearings,
    tasks,
    docs,
    expenses,
    notes,
    activities,
    search,
    setSearch,
    selectedClient,
    selectedCase,
    setSelectedClient,
    setSelectedCase,
    moveTask,
    restoreTask,
    addNote,
    updateNote,
    setModal,
    deleteClient,
    deleteCase,
    canViewFinance: authState.user?.role === "LAWYER",
    usersService,
    authUser: authState.user,
    showToast,
    logout,
    notifications,
  };
  const availableRoutes = appRoutes.filter(route => !route.roles || route.roles.includes(authState.user?.role));
  const activeRoute = availableRoutes.find(route => route.key === page) || availableRoutes[0];
  const isDetailRoute = activeRoute.hasDetail?.(routeContext);
  const ActivePage = isDetailRoute ? activeRoute.detailComponent : activeRoute.component;
  const activePageProps = isDetailRoute
    ? activeRoute.getDetailProps(routeContext)
    : activeRoute.getProps(routeContext);

  const appContent = (() => {
    if (authState.loading) {
      return <div className="auth-shell"><div className="text-muted">Loading session...</div></div>;
    }

    if (!authState.user && window.location.pathname === "/reset-password") {
      return <ResetPasswordPage />;
    }

    if (!authState.user) {
      return <LoginPage onLogin={login} error={authState.error} />;
    }

    return (
      <DashboardLayout
        page={page}
        setPage={setPage}
        selectedClient={selectedClient}
        selectedCase={selectedCase}
        setSelectedClient={setSelectedClient}
        setSelectedCase={setSelectedCase}
        setModal={setModal}
        navItems={availableRoutes}
        toast={toast}
        user={authState.user}
        onLogout={logout}
        notifications={notifications}
        modals={(
          <>
            {modal?.type === "add-client" && <AddClientModal onClose={closeModal} onSave={addClient} />}
            {modal?.type === "edit-client" && (
              <AddClientModal
                onClose={closeModal}
                onSave={(data) => updateClient(modal.data.id, data)}
                initialValues={modal.data}
                title="Edit Client"
                saveLabel="Save Changes"
              />
            )}
            {modal?.type === "add-case" && <AddCaseModal onClose={closeModal} onSave={addCase} clients={clients} />}
            {modal?.type === "edit-case" && (
              <AddCaseModal
                onClose={closeModal}
                onSave={(data) => updateCase(modal.data.id, data)}
                clients={clients}
                initialValues={modal.data}
                title="Edit Case"
                saveLabel="Save Changes"
              />
            )}
            {modal?.type === "add-task" && <AddTaskModal onClose={closeModal} onSave={addTask} cases={cases} />}
            {modal?.type === "add-hearing" && <AddHearingModal onClose={closeModal} onSave={addHearing} cases={cases} />}
            {modal?.type === "upload-doc" && <UploadDocModal onClose={closeModal} cases={cases} clients={clients} onSave={addDocument} />}
            {modal?.type === "add-expense" && <AddExpenseModal onClose={closeModal} clients={clients} cases={cases} onSave={addExpense} />}
          </>
        )}
      >
        <ActivePage {...activePageProps} />
      </DashboardLayout>
    );
  })();

  return <I18nProvider>{authState.user ? <AppProviders>{appContent}</AppProviders> : appContent}</I18nProvider>;
}

