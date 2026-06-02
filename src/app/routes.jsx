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
    getDetailProps: ({ selectedClient, cases, docs, activities, expenses, canViewFinance, setSelectedClient, setModal, deleteClient, deleteDocument }) => ({
      client: selectedClient,
      cases,
      docs,
      activities,
      expenses,
      canViewFinance,
      onBack: () => setSelectedClient(null),
      onEdit: () => setModal({ type: "edit-client", data: selectedClient }),
      onDelete: deleteClient,
      onEditDocument: doc => setModal({ type: "edit-doc", data: doc }),
      onDeleteDocument: deleteDocument,
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
    getDetailProps: ({ selectedCase, clients, hearings, docs, tasks, setSelectedCase, setModal, deleteCase, deleteDocument }) => ({
      caseItem: selectedCase,
      clients,
      hearings,
      docs,
      tasks,
      onBack: () => setSelectedCase(null),
      onEdit: () => setModal({ type: "edit-case", data: selectedCase }),
      onDelete: deleteCase,
      onEditDocument: doc => setModal({ type: "edit-doc", data: doc }),
      onDeleteDocument: deleteDocument,
    }),
  },
  {
    key: "documents",
    label: "Documents",
    icon: I.docs,
    component: DocumentsPage,
    action: { label: "Upload Document", icon: I.upload, modalType: "upload-doc" },
    getProps: ({ docs, cases, clients, search, setSearch, setModal, deleteDocument }) => ({
      docs,
      cases,
      clients,
      search,
      setSearch,
      onEdit: doc => setModal({ type: "edit-doc", data: doc }),
      onDelete: deleteDocument,
    }),
  },
  {
    key: "calendar",
    label: "Calendar",
    icon: I.calendar,
    component: CalendarPage,
    action: { label: "Schedule Hearing", icon: I.add, modalType: "add-hearing" },
    getProps: ({ hearings, cases, setModal }) => ({
      hearings,
      cases,
      onSelectHearing: hearing => setModal({ type: "edit-hearing", data: hearing }),
    }),
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
    getProps: ({ tasks, cases, moveTask, restoreTask, setModal, deleteTask }) => ({
      tasks,
      cases,
      onMove: moveTask,
      onRestore: restoreTask,
      onEdit: task => setModal({ type: "edit-task", data: task }),
      onDelete: deleteTask,
    }),
  },
  {
    key: "notes",
    label: "Notes",
    icon: I.notes,
    component: NotesPage,
    getProps: ({ clients, cases, notes, addNote, updateNote, deleteNote }) => ({
      clients,
      cases,
      notes,
      onCreate: addNote,
      onUpdate: updateNote,
      onDelete: deleteNote,
    }),
  },
  {
    key: "settings",
    label: "Settings",
    icon: I.settings,
    section: "system",
    roles: ["LAWYER"],
    component: SettingsPage,
    getProps: ({ usersService, authUser, showToast, logout, appSettings, updateAppSettings }) => ({
      usersService,
      currentUser: authUser,
      onToast: showToast,
      onLogout: logout,
      appSettings,
      onSettingsChange: updateAppSettings,
    }),
  },
];

export function getAppRoute(key) {
  return appRoutes.find(route => route.key === key) || appRoutes[0];
}
