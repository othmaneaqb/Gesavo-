import { Fragment, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useHearings } from "@/features/calendar/hooks/useHearings";
import { useCases } from "@/features/cases/hooks/useCases";
import { useClients } from "@/features/clients/hooks/useClients";
import { useDashboardInsights } from "@/features/dashboard/hooks/useDashboardInsights";
import { useDocuments } from "@/features/documents/hooks/useDocuments";
import { useFinance } from "@/features/finance/hooks/useFinance";
import { useNotes } from "@/features/notes/hooks/useNotes";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { useTeam } from "@/features/users/hooks/useTeam";
import { usersService } from "@/features/users/services/usersService";
import { DashboardLayout } from "@/layouts";
import AppModals from "./AppModals";
import RouteDataBoundary from "./RouteDataBoundary";
import { RoleGuard } from "./guards";
import {
  DEFAULT_APP_PATH,
  appRoutes,
  getRouteData,
  resolveAppLocation,
} from "./routes";
import { useToast } from "./hooks/useToast";

function WorkspacePage({ route, isDetail, context, states }) {
  if (isDetail) {
    const entityKey = route.detailEntity === "client" ? "clients" : "cases";
    const entity = route.detailEntity === "client"
      ? context.selectedClient
      : context.selectedCase;
    const entityState = states[entityKey];
    if (!entityState.loaded && !entityState.error) {
      return <div className="empty-state"><h3>Loading...</h3></div>;
    }
    if (entityState.error) return null;
    if (!entity) return <Navigate to={route.path} replace />;
    const DetailPage = route.detailComponent;
    return <DetailPage {...route.getDetailProps(context)} />;
  }

  const Page = route.component;
  return <Page {...route.getProps(context)} />;
}

export default function Workspace({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const { toast, showToast } = useToast();
  const canViewFinance = ["ADMIN", "LAWYER"].includes(user.role);
  const canManageLegal = ["ADMIN", "LAWYER"].includes(user.role);
  const currentLocation = useMemo(
    () => resolveAppLocation(location.pathname),
    [location.pathname],
  );
  const currentAllowed = currentLocation && (
    !currentLocation.route.roles || currentLocation.route.roles.includes(user.role)
  );
  const requiredData = useMemo(() => (
    currentAllowed
      ? getRouteData(currentLocation.route, currentLocation.isDetail, canViewFinance)
      : []
  ), [canViewFinance, currentAllowed, currentLocation]);
  const needs = key => requiredData.includes(key);

  const casesData = useCases({ enabled: needs("cases"), showToast });
  const financeData = useFinance({ enabled: needs("finance") && canViewFinance, showToast });
  const clientsData = useClients({
    enabled: needs("clients"),
    cases: casesData.items,
    expenses: financeData.items,
    showToast,
  });
  const tasksData = useTasks({ enabled: needs("tasks"), showToast });
  const hearingsData = useHearings({ enabled: needs("hearings"), showToast });
  const documentsData = useDocuments({ enabled: needs("documents"), showToast });
  const notesData = useNotes({ enabled: needs("notes"), showToast });
  const teamData = useTeam({ enabled: needs("team") });

  const activities = useDashboardInsights({
    documents: documentsData.items,
    notes: notesData.items,
    expenses: financeData.items,
  });
  const notifications = useNotifications({
    user,
    tasks: tasksData.items,
    hearings: hearingsData.items,
    documents: documentsData.items,
    cases: casesData.items,
  });

  const navigateTo = path => {
    setModal(null);
    navigate(path);
  };
  const selectedClient = currentLocation?.isDetail && currentLocation.route.key === "clients"
    ? clientsData.items.find(item => String(item.id) === currentLocation.params.clientId)
    : null;
  const selectedCase = currentLocation?.isDetail && currentLocation.route.key === "cases"
    ? casesData.items.find(item => String(item.id) === currentLocation.params.caseId)
    : null;
  const activeRoute = currentLocation?.route || appRoutes[0];
  const availableRoutes = appRoutes.filter(route => !route.roles || route.roles.includes(user.role));
  const states = {
    clients: clientsData.state,
    cases: casesData.state,
    tasks: tasksData.state,
    hearings: hearingsData.state,
    documents: documentsData.state,
    finance: financeData.state,
    notes: notesData.state,
    team: teamData.state,
  };
  const routeContext = {
    clients: clientsData.items,
    clientsState: clientsData.state,
    cases: casesData.items,
    hearings: hearingsData.items,
    tasks: tasksData.items,
    docs: documentsData.items,
    expenses: financeData.items,
    notes: notesData.items,
    activities,
    search,
    setSearch,
    selectedClient,
    selectedCase,
    navigate: navigateTo,
    setModal,
    deleteClient: clientsData.deleteClient,
    deleteCase: casesData.deleteCase,
    moveTask: tasksData.moveTask,
    restoreTask: tasksData.restoreTask,
    addNote: notesData.createNote,
    updateNote: notesData.updateNote,
    canViewFinance,
    canManageLegal,
    usersService,
    authUser: user,
    showToast,
    logout: onLogout,
  };
  const detailTitle = selectedClient?.name || selectedCase?.title || null;

  return (
    <DashboardLayout
      activeRoute={activeRoute}
      isDetail={Boolean(currentLocation?.isDetail)}
      detailTitle={detailTitle}
      onNavigate={navigateTo}
      setModal={setModal}
      navItems={availableRoutes}
      toast={toast}
      user={user}
      onLogout={onLogout}
      notifications={notifications}
      modals={(
        <AppModals
          modal={modal}
          onClose={() => setModal(null)}
          clients={clientsData.items}
          cases={casesData.items}
          team={teamData.items}
          user={user}
          clientsActions={clientsData}
          casesActions={casesData}
          createTask={tasksData.createTask}
          createHearing={hearingsData.createHearing}
          createDocument={documentsData.createDocument}
          createTransaction={financeData.createTransaction}
        />
      )}
    >
      <Routes>
        <Route path="/" element={<Navigate to={DEFAULT_APP_PATH} replace />} />
        {appRoutes.map(route => (
          <Fragment key={route.key}>
            <Route
              path={route.path}
              element={(
                <RoleGuard user={user} roles={route.roles}>
                  <RouteDataBoundary required={getRouteData(route, false, canViewFinance)} states={states}>
                    <WorkspacePage route={route} isDetail={false} context={routeContext} states={states} />
                  </RouteDataBoundary>
                </RoleGuard>
              )}
            />
            {route.detailPath && (
              <Route
                path={route.detailPath}
                element={(
                  <RoleGuard user={user} roles={route.roles}>
                    <RouteDataBoundary required={getRouteData(route, true, canViewFinance)} states={states}>
                      <WorkspacePage route={route} isDetail context={routeContext} states={states} />
                    </RouteDataBoundary>
                  </RoleGuard>
                )}
              />
            )}
          </Fragment>
        ))}
        <Route path="*" element={<Navigate to={DEFAULT_APP_PATH} replace />} />
      </Routes>
    </DashboardLayout>
  );
}
