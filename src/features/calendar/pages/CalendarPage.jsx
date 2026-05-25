import { useState } from "react";
import { useI18n } from "@/i18n";
import { fmtDate } from "@/shared/utils";

const weekdayLabels = {
  fr: ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"],
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  ar: ["ح", "ن", "ث", "ر", "خ", "ج", "س"],
};

const localeByLanguage = { fr: "fr-FR", en: "en-US", ar: "ar-MA" };

export default function CalendarPage({ hearings, cases }) {
  const { language, t } = useI18n();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString(localeByLanguage[language] || "fr-FR", { month: "long", year: "numeric" });

  const hearingDates = hearings.map(h => parseInt(h.date.split("-")[2]));

  const prev = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1));
  const next = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1));

  const upcomingList = hearings.filter(h => h.status === "upcoming").sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="grid-2" style={{ alignItems: "start" }}>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{monthName}</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={prev}>◀</button>
            <button className="btn btn-ghost btn-sm" onClick={next}>▶</button>
          </div>
        </div>
        <div className="calendar-grid">
          {(weekdayLabels[language] || weekdayLabels.fr).map(d => <div key={d} className="cal-day-label">{d}</div>)}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth();
            const hasEvent = hearingDates.includes(day);
            return (
              <div key={day} className={`cal-day ${isToday ? "today" : ""}`}>
                <span className="day-num">{day}</span>
                {hasEvent && <div className="cal-dot" />}
              </div>
            );
          })}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h3 className="card-title">{t("ui.scheduledHearings")}</h3></div>
        {upcomingList.map(h => {
          const caseItem = cases.find(c => c.id === h.caseId);
          return (
            <div key={h.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13.5 }}>{h.title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{h.court}</div>
                  <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 2 }}>{fmtDate(h.date)} · {h.time}</div>
                </div>
                {caseItem && <span className={`badge badge-${caseItem.type}`}>{t(`status.${caseItem.type}`, caseItem.type)}</span>}
              </div>
            </div>
          );
        })}
        {upcomingList.length === 0 && <div className="empty-state"><h3>{t("ui.noUpcomingHearings")}</h3></div>}
        {hearings.filter(h => h.status === "completed").length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", marginBottom: 8 }}>{t("ui.pastHearings")}</div>
            {hearings.filter(h => h.status === "completed").map(h => (
              <div key={h.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", opacity: 0.7 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{h.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{fmtDate(h.date)}</div>
                {h.outcome && <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 4, fontStyle: "italic" }}>{t("ui.outcome")}: {h.outcome}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
