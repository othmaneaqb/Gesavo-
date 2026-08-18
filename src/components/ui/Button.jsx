export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel = "Loading",
  disabled = false,
  className = "",
  type = "button",
  children,
  ...props
}) {
  const isDisabled = disabled || loading;
  const classes = ["btn", `btn-${variant}`, `btn-${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="btn-loading-label">{loadingLabel}</span> : children}
    </button>
  );
}
