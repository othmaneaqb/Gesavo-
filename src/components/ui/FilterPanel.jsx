import { useId } from "react";

export default function FilterPanel({ title, clearLabel, children, onClear, canClear = false, className = "" }) {
  const titleId = useId();

  return (
    <section className={`filter-panel ${className}`.trim()} aria-labelledby={title ? titleId : undefined}>
      <div className="filter-panel-header">
        {title && <h3 id={titleId}>{title}</h3>}
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
