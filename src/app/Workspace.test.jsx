import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "@/i18n";
import { casesService } from "@/features/cases/services/casesService";
import { clientsService } from "@/features/clients/services/clientsService";
import { tasksService } from "@/features/tasks/services/tasksService";
import { hearingsService } from "@/features/calendar/services/hearingsService";
import { documentsService } from "@/features/documents/services/documentsService";
import { financeService } from "@/features/finance/services/financeService";
import { notesService } from "@/features/notes/services/notesService";
import { usersService } from "@/features/users/services/usersService";
import Workspace from "./Workspace";

jest.mock("@/features/cases/services/casesService", () => ({ casesService: { getAll: jest.fn() } }));
jest.mock("@/features/clients/services/clientsService", () => ({ clientsService: { getAll: jest.fn() } }));
jest.mock("@/features/tasks/services/tasksService", () => ({ tasksService: { getAll: jest.fn() } }));
jest.mock("@/features/calendar/services/hearingsService", () => ({ hearingsService: { getAll: jest.fn() } }));
jest.mock("@/features/documents/services/documentsService", () => ({ documentsService: { getAll: jest.fn() } }));
jest.mock("@/features/finance/services/financeService", () => ({ financeService: { getAll: jest.fn() } }));
jest.mock("@/features/notes/services/notesService", () => ({ notesService: { getAll: jest.fn() } }));
jest.mock("@/features/users/services/usersService", () => ({
  usersService: {
    getTeam: jest.fn(),
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    resetPassword: jest.fn(),
  },
}));

describe("Workspace route loading", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    casesService.getAll.mockResolvedValue([]);
    clientsService.getAll.mockResolvedValue([]);
    tasksService.getAll.mockResolvedValue([]);
    hearingsService.getAll.mockResolvedValue([]);
    documentsService.getAll.mockResolvedValue([]);
    financeService.getAll.mockResolvedValue([]);
    notesService.getAll.mockResolvedValue([]);
    usersService.getTeam.mockResolvedValue([]);
  });

  test("the Tasks URL loads only Tasks and its direct dependencies", async () => {
    render(
      <MemoryRouter
        initialEntries={["/tasks"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <I18nProvider>
          <Workspace
            user={{ id: 10, username: "assistant", role: "ASSISTANT" }}
            onLogout={jest.fn()}
          />
        </I18nProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(tasksService.getAll).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(casesService.getAll).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(usersService.getTeam).toHaveBeenCalledTimes(1));

    expect(clientsService.getAll).not.toHaveBeenCalled();
    expect(hearingsService.getAll).not.toHaveBeenCalled();
    expect(documentsService.getAll).not.toHaveBeenCalled();
    expect(financeService.getAll).not.toHaveBeenCalled();
    expect(notesService.getAll).not.toHaveBeenCalled();
  });
});
