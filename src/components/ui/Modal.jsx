import { I } from "@/shared/constants";
import { useI18n } from "@/i18n";

export default function Modal({ title, onClose, onSave, saveLabel = "Save", children }) {
  const { t } = useI18n();
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="close-btn" onClick={onClose}>{I.close}</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>{t("ui.cancel")}</button>
          <button className="btn btn-primary" onClick={onSave}>{saveLabel === "Save" ? t("ui.save") : saveLabel}</button>
        </div>
      </div>
    </div>
  );
}
