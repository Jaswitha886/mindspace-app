// Small-cohort suppression (docs/MASTER_PROMPT.md): an admin-facing breakdown
// whose underlying cohort is smaller than MIN_COHORT must read "insufficient
// data" rather than a number or a graph. With a handful of students behind a
// bar, a department-wise or severity-wise split re-identifies people.
//
// This guards *breakdowns* (by department, by severity, by counsellor), not
// platform-wide totals like "sessions this period", which single nobody out.
export const MIN_COHORT = 5;

export const INSUFFICIENT_DATA = "Insufficient data to display.";

/** True when a breakdown over this many distinct students may be shown. */
export function cohortIsReportable(distinctStudents: number): boolean {
  return distinctStudents >= MIN_COHORT;
}

/** Distinct students behind a set of rows — the cohort size to test. */
export function cohortSize(studentIds: Iterable<string>): number {
  return new Set(studentIds).size;
}
