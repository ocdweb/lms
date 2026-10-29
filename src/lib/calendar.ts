import "server-only";
import { google, type calendar_v3 } from "googleapis";
import { addDays, parseISODate, toISODate } from "./dates";
import { TIMEZONE, calendarConfigured } from "./config";

let client: calendar_v3.Calendar | null = null;

function calendar() {
  if (!client) {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/calendar.events"],
    });
    client = google.calendar({ version: "v3", auth });
  }
  return client;
}

type AllDayEvent = { summary: string; description?: string; start: Date; end: Date; colorId?: string };

/** Creates an all-day event on the shared company calendar. Returns the event id, or null if disabled/failed. */
export async function createCalendarEvent(ev: AllDayEvent): Promise<string | null> {
  if (!calendarConfigured()) return null;
  try {
    const res = await calendar().events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID!,
      requestBody: {
        summary: ev.summary,
        description: ev.description,
        colorId: ev.colorId,
        transparency: "transparent",
        // Google's all-day end date is exclusive
        start: { date: toISODate(ev.start), timeZone: TIMEZONE },
        end: { date: toISODate(addDays(parseISODate(toISODate(ev.end)), 1)), timeZone: TIMEZONE },
      },
    });
    return res.data.id ?? null;
  } catch (err) {
    console.error("[calendar] create failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function deleteCalendarEvent(eventId?: string | null) {
  if (!eventId || !calendarConfigured()) return;
  try {
    await calendar().events.delete({ calendarId: process.env.GOOGLE_CALENDAR_ID!, eventId });
  } catch (err) {
    console.error("[calendar] delete failed:", err instanceof Error ? err.message : err);
  }
}
