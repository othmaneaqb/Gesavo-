import { renderHook, waitFor } from "@testing-library/react";
import { useApiCollection } from "./useApiCollection";

describe("useApiCollection", () => {
  test("does not load a feature until its route enables it", async () => {
    const load = jest.fn().mockResolvedValue([{ id: 1 }]);
    const { result, rerender } = renderHook(
      ({ enabled }) => useApiCollection({
        enabled,
        load,
        errorMessage: () => "failed",
      }),
      { initialProps: { enabled: false } },
    );

    expect(load).not.toHaveBeenCalled();
    expect(result.current.state.loaded).toBe(false);

    rerender({ enabled: true });
    await waitFor(() => expect(result.current.state.loaded).toBe(true));
    expect(load).toHaveBeenCalledTimes(1);
    expect(result.current.items).toEqual([{ id: 1 }]);
  });

  test("keeps loading and errors independent between features", async () => {
    const loadClients = jest.fn().mockResolvedValue([{ id: "client" }]);
    const loadFinance = jest.fn().mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => ({
      clients: useApiCollection({
        enabled: true,
        load: loadClients,
        errorMessage: () => "clients unavailable",
      }),
      finance: useApiCollection({
        enabled: true,
        load: loadFinance,
        errorMessage: () => "finance unavailable",
      }),
    }));

    await waitFor(() => expect(result.current.clients.state.loaded).toBe(true));
    await waitFor(() => expect(result.current.finance.state.error).toBe("finance unavailable"));

    expect(result.current.clients.items).toEqual([{ id: "client" }]);
    expect(result.current.clients.state.error).toBeNull();
    expect(result.current.finance.items).toEqual([]);
    expect(loadFinance).toHaveBeenCalledTimes(1);
  });
});
