import { createRefreshQueue } from "./refreshQueue";

describe("createRefreshQueue", () => {
  test("shares one refresh across concurrent callers", async () => {
    const refresh = jest.fn().mockResolvedValue("new-access");
    const enqueue = createRefreshQueue(refresh);

    const results = await Promise.all([enqueue(), enqueue(), enqueue()]);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(results).toEqual(["new-access", "new-access", "new-access"]);
  });

  test("rejects all queued callers once and permits a later retry", async () => {
    const refreshError = new Error("refresh rejected");
    const refresh = jest.fn()
      .mockRejectedValueOnce(refreshError)
      .mockResolvedValue("recovered-access");
    const onFailure = jest.fn();
    const enqueue = createRefreshQueue(refresh, onFailure);

    const failed = await Promise.allSettled([enqueue(), enqueue()]);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(onFailure).toHaveBeenCalledTimes(1);
    expect(failed.every(result => result.status === "rejected")).toBe(true);
    await expect(enqueue()).resolves.toBe("recovered-access");
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
