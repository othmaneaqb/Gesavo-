import { CalendarPage } from "@/features/calendar";
import { CaseDetail, CasesPage } from "@/features/cases";
import { ClientDetail, ClientsPage } from "@/features/clients";
import { Dashboard } from "@/features/dashboard";
import { DocumentsPage } from "@/features/documents";
import { FinancePage } from "@/features/finance";
import NotesPage from "@/features/notes/pages/NotesPage";
import { SettingsPage } from "@/features/settings";
import { TasksPage } from "@/features/tasks";
import { I } from "@/shared/constants";

export const appRoutes = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: I.dash,
    component: Dashboard,
    getProps: ({ clients, cases, tasks, hearings, expenses, activities, canViewFinance }) => ({
      clients,
      cases,
      tasks,
      hearings,
      expenses,
      activities,
      canViewFinance,
    }),
  },
  {
    key: "clients",
    label: "Clients",
    icon: I.clients,
    component: ClientsPage,
    action: { label: "Add Client", icon: I.add, modalType: "add-client", hideWhenDetail: "client" },
    detailComponent: ClientDetail,
    hasDetail: ({ selectedClient }) => Boolean(selectedClient),
    getProps: ({ clients, clientsState, search, setSearch, setSelectedClient }) => ({
      clients,
      clientsState,
      search,
      setSearch,
      onSelect: setSelectedClient,
    }),
    getDetailProps: ({ selectedClient, cases, docs, activities, expenses, canViewFinance, setSelectedClient, setModal, deleteClient }) => ({
      client: selectedClient,
      cases,
      docs,
      activities,
      expenses,
      canViewFinance,
      onBack: () => setSelectedClient(null),
      onEdit: () => setModal({ type: "edit-client", data: selectedClient }),
      onDelete: deleteClient,
    }),
  },
  {
    key: "cases",
    label: "Cases",
    icon: I.cases,
    component: CasesPage,
    action: { label: "Open Case", icon: I.add, modalType: "add-case", hideWhenDetail: "case" },
    detailComponent: CaseDetail,
    hasDetail: ({ selectedCase }) => Boolean(selectedCase),
    getProps: ({ cases, clients, search, setSearch, setSelectedCase }) => ({
      cases,
      clients,
      search,
      setSearch,
      onSelect: setSelectedCase,
    }),
    getDetailProps: ({ selectedCase, clients, hearings, docs, tasks, setSelectedCase, setModal, deleteCase }) => ({
      caseItem: selectedCase,
      clients,
      hearings,
      docs,
      tasks,
      onBack: () => setSelectedCase(null),
      onEdit: () => setModal({ type: "edit-case", data: selectedCase }),
      onDelete: deleteCase,
    }),
  },
  {
    key: "documents",
    label: "Documents",
    icon: I.docs,
    component: DocumentsPage,
    action: { label: "Upload Document", icon: I.upload, modalType: "upload-doc" },
    getProps: ({ docs, cases, clients, search, setSearch }) => ({
      docs,
      cases,
      clients,
      search,
      setSearch,
    }),
  },
  {
    key: "calendar",
    label: "Calendar",
    icon: I.calendar,
    component: CalendarPage,
    action: { label: "Schedule Hearing", icon: I.add, modalType: "add-hearing" },
    getProps: ({ hearings, cases }) => ({ hearings, cases }),
  },
  {
    key: "finance",
    label: "Finance",
    icon: I.finance,
    roles: ["LAWYER"],
    component: FinancePage,
    action: { label: "Record Transaction", icon: I.add, modalType: "add-expense" },
    getProps: ({ clients, expenses, cases }) => ({ clients, expenses, cases }),
  },
  {
    key: "tasks",
    label: "Tasks",
    icon: I.tasks,
    component: TasksPage,
    action: { label: "New Task", icon: I.add, modalType: "add-task" },
    getProps: ({ tasks, cases, moveTask, restoreTask }) => ({
      tasks,
      cases,
      onMove: moveTask,
      onRestore: restoreTask,
    }),
  },
  {
    key: "notes",
    label: "Notes",
    icon: I.notes,
    component: NotesPage,
    getProps: ({ clients, cases, notes, addNote, updateNote }) => ({ clients, cases, notes, onCreate: addNote, onUpdate: updateNote }),
  },
  {
    key: "settings",
    label: "Settings",
    icon: I.settings,
    section: "system",
    roles: ["LAWYER"],
    component: SettingsPage,
    getProps: ({ usersService, authUser, showToast, logout }) => ({
      usersService,
      currentUser: authUser,
      onToast: showToast,
      onLogout: logout,
    }),
  },
];

export function getAppRoute(key) {
  return appRoutes.find(route => route.key === key) || appRoutes[0];
}
