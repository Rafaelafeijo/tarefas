// Dates always show in one fixed time zone: server and browser must render the same
// text, otherwise React reports a hydration mismatch. Brazil has had no daylight
// saving since 2019, so a constant offset is enough.
const OFFSET_HOURS = 3;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ISO timestamp -> the "YYYY-MM-DDTHH:mm" text that <input type="datetime-local"> expects.
export function toDateTimeInput(iso: string) {
  const shifted = new Date(iso).getTime() - OFFSET_HOURS * 60 * 60 * 1000;
  return new Date(shifted).toISOString().slice(0, 16);
}

export function fromDateTimeInput(value: string) {
  return new Date(`${value}:00-0${OFFSET_HOURS}:00`).toISOString();
}

// Built by hand: Intl's date and time output can differ between browsers and Node.
export function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${MONTHS[Number(month) - 1]} ${Number(day)}, ${year}`;
}

export function formatDateTime(iso: string) {
  const [date, time] = toDateTimeInput(iso).split("T");
  return `${formatDate(date)}, ${time}`;
}

// "YYYY-MM-DD" strings sort like dates, so plain comparison is enough.
export function isOverdue(dueDate: string) {
  return dueDate < toDateTimeInput(new Date().toISOString()).slice(0, 10);
}
