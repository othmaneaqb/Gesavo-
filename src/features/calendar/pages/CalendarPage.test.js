import {
  getHearingDaysForMonth,
  isSameCalendarDate,
} from "./CalendarPage";

describe("CalendarPage date matching", () => {
  test("marks only hearings in the visible month and year", () => {
    const hearings = [
      { date: "2026-01-15" },
      { date: "2026-02-15" },
      { date: "2025-02-21" },
      { date: "2026-02-28" },
      { date: "invalid" },
    ];

    expect([...getHearingDaysForMonth(hearings, new Date(2026, 1, 1))])
      .toEqual([15, 28]);
  });

  test("today comparison includes the year", () => {
    expect(isSameCalendarDate(
      new Date(2026, 7, 11),
      new Date(2026, 7, 11),
    )).toBe(true);
    expect(isSameCalendarDate(
      new Date(2025, 7, 11),
      new Date(2026, 7, 11),
    )).toBe(false);
  });
});
