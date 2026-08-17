import { matchPath } from "react-router-dom";
import { CalendarPage } from "@/features/calendar";
import { CaseDetail, CasesPage } from "@/features/cases";
import { ClientDetail, ClientsPage } from "@/features/clients";
import { Dashboard } from "@/features/dashboard";
import { DocumentsPage } from "@/features/documents";
import { FinancePage } from "@/features/finance";
import { NotesPage } from "@/features/notes";
import { SettingsPage } from "@/features/settings";
import { TasksPage } from "@/features/tasks";
import { I } from "@/shared/constants";

export const DEFAULT_APP_PATH = "/dashboard";

export const appRoutes = [
  {
    key: "dashboard",
    path: DEFAULT_APP_PATH,
    label: "Dashboard",
    icon: I.dash,
    component: Dashboard,
    data: ["clients", "cases", "tasks", "hearings", "documents", "notes", "finance"],
    getProps: ({ clients, cases, tasks, hearings, expenses, activities, canViewFinance }) => ({
      clients, cases, tasks, hearings, expenses, activities, canViewFinance,
    }),
  },
  {
    key: "clients",
    path: "/clients",
    detailPath: "/clients/:clientId",
    detailEntity: "client",
    label: "Clients",
    icon: I.clients,
    data: ["clients", "cases", "finance"],
    detailData: ["clients", "cases", "documents", "notes", "finance"],
    component: ClientsPage,
    detailComponent: ClientDetail,
    action: {
      label: "Add Client",
      icon: I.add,
      modalType: "add-client",
      hideWhenDetail: true,
      roles: ["ADMIN", "LAWYER"],
    },
    getProps: ({ clients, clientsState, search, setSearch, navigate }) => ({
      clients,
      clientsState,
      search,
      setSearch,
      onSelect: client => navigate(`/clients/${client.id}`),
    }),
    getDetailProps: ({
      selectedClient, cases, docs, activities, expenses, canViewFinance,
      canManageLegal, setModal, deleteClient, navigate,
    }) => ({
      client: selectedClient,
      cases,
      docs,
      activities,
      expenses,
      canViewFinance,
      canManageLegal,
      onBack: () => navigate("/clients"),
      onEdit: () => setModal({ type: "edit-client", data: selectedClient }),
      onDelete: async id => {
        if (await deleteClient(id)) navigate("/clients");
      },
    }),
  },
  {
    key: "cases",
    path: "/cases",
    detailPath: "/cases/:caseId",
    detailEntity: "case",
    label: "Cases",
    icon: I.cases,
    data: ["cases", "clients"],
    detailData: ["cases", "clients", "hearings", "documents", "tasks"],
    component: CasesPage,
    detailComponent: CaseDetail,
    action: {
      label: "Open Case",
      icon: I.add,
      modalType: "add-case",
      hideWhenDetail: true,
      roles: ["ADMIN", "LAWYER"],
    },
    getProps: ({ cases, clients, search, setSearch, navigate }) => ({
      cases,
      clients,
      search,
      setSearch,
      onSelect: caseItem => navigate(`/cases/${caseItem.id}`),
    }),
    getDetailProps: ({
      selectedCase, clients, hearings, docs, tasks, canManageLegal,
      setModal, deleteCase, navigate,
    }) => ({
      caseItem: selectedCase,
      clients,
      hearings,
      docs,
      tasks,
      canManageLegal,
      onBack: () => navigate("/cases"),
      onEdit: () => setModal({ type: "edit-case", data: selectedCase }),
      onDelete: async id => {
        if (await deleteCase(id)) navigate("/cases");
      },
    }),
  },
  {
    key: "documents",
    path: "/documents",
    label: "Documents",
    icon: I.docs,
    data: ["documents", "cases", "clients"],
    component: DocumentsPage,
    action: { label: "Upload Document", icon: I.upload, modalType: "upload-doc" },
    getProps: ({ docs, cases, clients, search, setSearch }) => ({
      docs, cases, clients, search, setSearch,
    }),
  },
  {
    key: "calendar",
    path: "/calendar",
    label: "Calendar",
    icon: I.calendar,
    data: ["hearings", "cases", "team"],
    component: CalendarPage,
    action: { label: "Schedule Hearing", icon: I.add, modalType: "add-hearing" },
    getProps: ({ hearings, cases }) => ({ hearings, cases }),
  },
  {
    key: "finance",
    path: "/finance",
    label: "Finance",
    icon: I.finance,
    roles: ["ADMIN", "LAWYER"],
    data: ["finance", "clients", "cases"],
    component: FinancePage,
    action: { label: "Record Transaction", icon: I.add, modalType: "add-expense" },
    getProps: ({ clients, expenses, cases }) => ({ clients, expenses, cases }),
  },
  {
    key: "tasks",
    path: "/tasks",
    label: "Tasks",
    icon: I.tasks,
    data: ["tasks", "cases", "team"],
    component: TasksPage,
    action: { label: "New Task", icon: I.add, modalType: "add-task" },
    getProps: ({ tasks, cases, moveTask, restoreTask }) => ({
      tasks, cases, onMove: moveTask, onRestore: restoreTask,
    }),
  },
  {
    key: "notes",
    path: "/notes",
    label: "Notes",
    icon: I.notes,
    data: ["notes", "clients"],
    component: NotesPage,
    getProps: ({ clients, notes, addNote, updateNote }) => ({
      clients, notes, onCreate: addNote, onUpdate: updateNote,
    }),
  },
  {
    key: "settings",
    path: "/settings",
    label: "Settings",
    icon: I.settings,
    section: "system",
    roles: ["ADMIN"],
    data: [],
    component: SettingsPage,
    getProps: ({ usersService, authUser, showToast, logout }) => ({
      usersService,
      currentUser: authUser,
      onToast: showToast,
      onLogout: logout,
    }),
  },
];

export function getRouteByKey(key) {
  return appRoutes.find(route => route.key === key) || appRoutes[0];
}

export function resolveAppLocation(pathname) {
  for (const route of appRoutes) {
    if (route.detailPath) {
      const match = matchPath({ path: route.detailPath, end: true }, pathname);
      if (match) return { route, isDetail: true, params: match.params };
    }
    const match = matchPath({ path: route.path, end: true }, pathname);
    if (match) return { route, isDetail: false, params: match.params };
  }
  return null;
}

export function getRouteData(route, isDetail, canViewFinance) {
  const data = isDetail ? route.detailData || route.data : route.data;
  return (data || []).filter(key => key !== "finance" || canViewFinance);
}
