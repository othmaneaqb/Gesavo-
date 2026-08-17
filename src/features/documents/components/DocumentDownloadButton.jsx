import { useState } from "react";
import { useI18n } from "@/i18n";
import { documentsService } from "../services/documentsService";
import { I } from "@/shared/constants";

export default function DocumentDownloadButton({ document, showLabel = false }) {
  const { t } = useI18n();
  const [state, setState] = useState("idle");

  const download = async () => {
    setState("downloading");
    try {
      await documentsService.download(document);
      setState("idle");
    } catch {
      setState("error");
    }
  };

  const failed = state === "error";
  const downloading = state === "downloading";
  const accessibleLabel = downloading
    ? t("ui.downloadInProgress")
    : failed
      ? t("ui.downloadFailed")
      : t("ui.download");

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        aria-label={accessibleLabel}
        title={failed ? t("ui.downloadFailed") : undefined}
        disabled={downloading}
        onClick={download}
      >
        {downloading ? "…" : I.download}{showLabel && ` ${t("ui.download")}`}
      </button>
      {failed && (
        <small role="alert" style={{ color: "var(--danger, #a22)", fontSize: 10 }}>
          {t("ui.downloadFailed")}
        </small>
      )}
    </span>
  );
}
