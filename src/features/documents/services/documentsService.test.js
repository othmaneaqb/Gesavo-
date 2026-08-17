import api from "@/services/api";
import {
  documentsService,
  formatBytes,
  toFrontendDocument,
} from "./documentsService";

jest.mock("@/services/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

describe("documentsService", () => {
  let clickSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    URL.createObjectURL = jest.fn(() => "blob:protected-document");
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    clickSpy.mockRestore();
    jest.useRealTimers();
  });

  test("maps protected download metadata returned by the API", () => {
    const document = toFrontendDocument({
      id: 7,
      title: "Evidence",
      original_filename: "evidence.pdf",
      mime_type: "application/pdf",
      size: 2048,
      sha256: "abc123",
      case: 3,
      client: 2,
      uploaded_at: "2026-08-11T12:00:00Z",
      description: "Court evidence",
      download_url: "http://api.test/api/documents/7/download/",
    });

    expect(document).toMatchObject({
      originalName: "evidence.pdf",
      type: "pdf",
      size: "2.0 KB",
      fileUrl: "http://api.test/api/documents/7/download/",
    });
    expect(formatBytes(10 * 1024 * 1024)).toBe("10.0 MB");
  });

  test("downloads from fileUrl and uses the sanitized original filename", async () => {
    const blob = new Blob(["protected"]);
    api.get.mockResolvedValue({ data: blob });

    await documentsService.download({
      name: "Displayed title",
      originalName: "safe-original.pdf",
      fileUrl: "/api/documents/7/download/",
    });

    expect(api.get).toHaveBeenCalledWith(
      "/api/documents/7/download/",
      { responseType: "blob" },
    );
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    const anchor = clickSpy.mock.instances[0];
    expect(anchor.download).toBe("safe-original.pdf");
    expect(document.body.contains(anchor)).toBe(false);

    jest.runOnlyPendingTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:protected-document");
  });

  test("does not issue an unprotected request when fileUrl is absent", async () => {
    await expect(documentsService.download({ name: "missing.pdf" }))
      .rejects.toThrow("protected download URL");
    expect(api.get).not.toHaveBeenCalled();
  });
});
