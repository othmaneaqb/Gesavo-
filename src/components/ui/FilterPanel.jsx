export default function FilterPanel({ title, clearLabel, children, onClear, canClear = false }) {
  return (
    <section className="filter-panel" aria-label={title}>
      <div className="filter-panel-header">
        <h3>{title}</h3>
        {onClear && (
          <button
            type="button"
            className="filter-clear"
            onClick={onClear}
            disabled={!canClear}
          >
            {clearLabel}
          </button>
        )}
      </div>
      <div className="filter-row">{children}</div>
    </section>
  );
}
