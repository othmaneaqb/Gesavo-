export default function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="toggle-row">
      <div>
        <div className="toggle-label">{label}</div>
        {description && <div className="toggle-description">{description}</div>}
      </div>
      <span className={`toggle ${checked ? "active" : ""}`}>
        <input type="checkbox" checked={checked} onChange={onChange} />
      </span>
    </label>
  );
}
