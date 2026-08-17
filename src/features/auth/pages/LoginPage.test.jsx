import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nProvider } from "@/i18n";
import LoginPage from "./LoginPage";

jest.mock("@/features/auth/services/authService", () => ({
  authService: { requestPasswordReset: jest.fn() },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  const renderLogin = onLogin => render(
    <I18nProvider>
      <LoginPage onLogin={onLogin} error={null} />
    </I18nProvider>,
  );

  test("password visibility button toggles the real input type", () => {
    renderLogin(jest.fn());
    const password = screen.getByPlaceholderText("Mot de passe");

    expect(password.type).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: "Afficher le mot de passe" }));
    expect(password.type).toBe("text");
    expect(screen.getByRole("button", { name: "Masquer le mot de passe" }))
      .not.toBeNull();
  });

  test("submits the Remember Me choice to the authentication lifecycle", async () => {
    const onLogin = jest.fn().mockResolvedValue(undefined);
    renderLogin(onLogin);

    fireEvent.change(screen.getByPlaceholderText("Adresse e-mail"), {
      target: { value: "lawyer@example.test" },
    });
    fireEvent.change(screen.getByPlaceholderText("Mot de passe"), {
      target: { value: "StrongPassword#2026" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Se souvenir de moi" }));
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(
      "lawyer@example.test",
      "StrongPassword#2026",
      true,
    ));
  });
});
