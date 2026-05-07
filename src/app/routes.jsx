import { CalendarPage } from "@/features/calendar";
import { CaseDetail, CasesPage } from "@/features/cases";
import { ClientDetail, ClientsPage } from "@/features/clients";
import { Dashboard } from "@/features/dashboard";
import { DocumentsPage } from "@/features/documents";
import { FinancePage } from "@/features/finance";
import { NotesPage } from "@/features/notes";
import { TasksPage } from "@/features/tasks";
import { I } from "@/shared/constants";

export const appRoutes = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: I.dash,
    component: Dashboard,
    getProps: ({ clients, cases, tasks, hearings, expenses, activities }) => ({
      clients,
      cases,
      tasks,
      hearings,
      expenses,
      activities,
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
    getProps: ({ clients, search, setSearch, setSelectedClient }) => ({
      clients,
      search,
      setSearch,
      onSelect: setSelectedClient,
    }),
    getDetailProps: ({ selectedClient, cases, docs, activities, expenses, setSelectedClient }) => ({
      client: selectedClient,
      cases,
      docs,
      activities,
      expenses,
      onBack: () => setSelectedClient(null),
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
    getDetailProps: ({ selectedCase, clients, hearings, docs, setSelectedCase }) => ({
      caseItem: selectedCase,
      clients,
      hearings,
      docs,
      onBack: () => setSelectedCase(null),
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
    getProps: ({ tasks, cases, moveTask }) => ({
      tasks,
      cases,
      onMove: moveTask,
    }),
  },
  {
    key: "notes",
    label: "Notes",
    icon: I.notes,
    component: NotesPage,
    getProps: ({ clients, cases }) => ({ clients, cases }),
  },
];

export function getAppRoute(key) {
  return appRoutes.find(route => route.key === key) || appRoutes[0];
}
