export function priorityColor(p) {
  return { urgent: "#C0392B", high: "#B5710A", normal: "#2A5080", low: "#888" }[p] || "#888";
}
