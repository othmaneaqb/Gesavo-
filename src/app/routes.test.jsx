import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { RoleGuard } from "./guards";
import {
  DEFAULT_APP_PATH,
  getRouteByKey,
  getRouteData,
  resolveAppLocation,
} from "./routes";

function CurrentPath() {
  return <div data-testid="path">{useLocation().pathname}</div>;
}

describe("application routes", () => {
  test("resolves list and detail URLs without internal page state", () => {
    const list = resolveAppLocation("/clients");
    const detail = resolveAppLocation("/clients/42");
    const caseDetail = resolveAppLocation("/cases/7");

    expect(list).toMatchObject({ isDetail: false, route: { key: "clients" } });
    expect(detail).toMatchObject({
      isDetail: true,
      route: { key: "clients" },
      params: { clientId: "42" },
    });
    expect(caseDetail).toMatchObject({
      isDetail: true,
      route: { key: "cases" },
      params: { caseId: "7" },
    });
  });

  test("keeps data requirements scoped to the active feature", () => {
    expect(getRouteData(getRouteByKey("tasks"), false, true))
      .toEqual(["tasks", "cases", "team"]);
    expect(getRouteData(getRouteByKey("documents"), false, true))
      .toEqual(["documents", "cases", "clients"]);
    expect(getRouteData(getRouteByKey("settings"), false, true)).toEqual([]);
    expect(getRouteData(getRouteByKey("dashboard"), false, false))
      .not.toContain("finance");
  });

  test("redirects an Assistant away from a Lawyer-only URL", () => {
    render(
      <MemoryRouter
        initialEntries={["/finance"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route
            path="/finance"
            element={(
              <RoleGuard user={{ role: "ASSISTANT" }} roles={["ADMIN", "LAWYER"]}>
                <div>Finance</div>
              </RoleGuard>
            )}
          />
          <Route path={DEFAULT_APP_PATH} element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("path").textContent).toBe(DEFAULT_APP_PATH);
    expect(screen.queryByText("Finance")).toBeNull();
  });
});
