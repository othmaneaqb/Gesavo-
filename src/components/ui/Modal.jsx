import { useEffect, useId, useRef } from "react";
import { I } from "@/shared/constants";
import { useI18n } from "@/i18n";
import Button from "./Button";

export default function Modal({
  title,
  onClose,
  onSave,
  saveLabel = "Save",
  saveDisabled = false,
  saving = false,
  children,
}) {
  const { t } = useI18n();
  const titleId = useId();
  const modalRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const modal = modalRef.current;
    const focusableSelector = "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex='-1'])";
    const focusable = modal?.querySelectorAll(focusableSelector);
    (focusable?.[0] || modal)?.focus();

    const handleKeyDown = event => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !modal) return;
      const controls = [...modal.querySelectorAll(focusableSelector)];
      if (!controls.length) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={event => event.target === event.currentTarget && onClose()}>
      <div
        className="modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h3 className="modal-title" id={titleId}>{title}</h3>
          <button type="button" className="close-btn" onClick={onClose} aria-label={t("common.close")}>{I.close}</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose}>{t("ui.cancel")}</Button>
          <Button
            variant="primary"
            onClick={onSave}
            disabled={saveDisabled}
            loading={saving}
            loadingLabel={t("ui.saving", "Saving")}
          >
            {saveLabel === "Save" ? t("ui.save") : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
