import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";

describe("App routing", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/clients");
  });

  test("protects a directly opened business URL with the login route", async () => {
    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe("/login"));
    expect(screen.getByRole("button", { name: "Se connecter" })).not.toBeNull();
  });
});
