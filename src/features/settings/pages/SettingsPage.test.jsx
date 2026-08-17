import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nProvider } from "@/i18n";
import SettingsPage from "./SettingsPage";

describe("SettingsPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("shows only real settings and persists the interface language", async () => {
    const usersService = {
      getAll: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      resetPassword: jest.fn(),
    };
    render(
      <I18nProvider>
        <SettingsPage
          usersService={usersService}
          currentUser={{ id: 1 }}
          onToast={jest.fn()}
          onLogout={jest.fn()}
        />
      </I18nProvider>,
    );

    await waitFor(() => expect(usersService.getAll).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Mode sombre")).toBeNull();
    expect(screen.queryByText("Authentification à deux facteurs")).toBeNull();
    expect(screen.queryByText("Profil cabinet")).toBeNull();

    fireEvent.change(screen.getByDisplayValue("Français"), {
      target: { value: "ar" },
    });
    await waitFor(() => expect(window.localStorage.getItem("app_language")).toBe("ar"));
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
  });
});
