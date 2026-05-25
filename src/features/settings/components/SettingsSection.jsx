export default function SettingsSection({ title, description, children }) {
  return (
    <section className="settings-section card">
      <div className="settings-section-header">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      <div className="settings-section-body">{children}</div>
    </section>
  );
}
