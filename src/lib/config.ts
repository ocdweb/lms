export const APP_NAME = "Legacy Media Leave";
export const COMPANY = "Legacy Media";
export const TIMEZONE = process.env.APP_TIMEZONE || "UTC";
export const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

export const DEPARTMENTS = [
  "Editorial",
  "Production",
  "Design & Creative",
  "Digital & Social",
  "Sales & Partnerships",
  "Operations & People",
  "Finance & Legal",
  "Technology",
];

export const emailConfigured = () => Boolean(process.env.SMTP_HOST);
export const calendarConfigured = () =>
  Boolean(process.env.GOOGLE_CALENDAR_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
