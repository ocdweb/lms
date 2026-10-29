import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const LEAVE_TYPES = [
  { code: "ANNUAL", name: "Annual Leave", icon: "beach_access", accent: "gold", defaultQuota: 20, minNoticeDays: 7, description: "Paid vacation entitlement for rest and travel. Book at least one week ahead." },
  { code: "CASUAL", name: "Casual Leave", icon: "coffee", accent: "ink", defaultQuota: 7, maxDaysPerRequest: 3, description: "Short personal errands and unplanned needs, up to 3 days at a time." },
  { code: "SICK", name: "Sick Leave", icon: "stethoscope", accent: "ink", defaultQuota: 8, allowPastDates: true, description: "Illness or medical appointments. Can be applied for after the leave date (post-recovery)." },
  { code: "PLANNED", name: "Planned Leave", icon: "event_upcoming", accent: "ink", defaultQuota: 5, minNoticeDays: 14, description: "Pre-planned personal commitments such as weddings or family events. Two weeks' notice." },
  { code: "BIRTHDAY", name: "Birthday Leave", icon: "cake", accent: "gold", defaultQuota: 1, birthdayMonthOnly: true, allowHalfDay: false, maxDaysPerRequest: 1, description: "A complimentary day off during your birthday month." },
  { code: "EID", name: "Eid Holidays", icon: "celebration", accent: "gold", defaultQuota: 0, deductsQuota: false, description: "Additional Eid days beyond the gazetted holidays. Does not deduct from your quota." },
  { code: "OTHER", name: "Other Leave", icon: "more_horiz", accent: "ink", defaultQuota: 0, deductsQuota: false, allowPastDates: true, description: "Compassionate, unpaid or other approved leave. Does not deduct from your quota." },
];

const HOLIDAYS = [
  { name: "Kashmir Solidarity Day", start: "2026-02-05", end: "2026-02-05" },
  { name: "Eid-ul-Fitr", start: "2026-03-20", end: "2026-03-23" },
  { name: "Pakistan Day", start: "2026-03-23", end: "2026-03-23" },
  { name: "Labour Day", start: "2026-05-01", end: "2026-05-01" },
  { name: "Eid-ul-Adha", start: "2026-05-27", end: "2026-05-29" },
  { name: "Ashura", start: "2026-06-25", end: "2026-06-26" },
  { name: "Independence Day", start: "2026-08-14", end: "2026-08-14" },
  { name: "Eid Milad-un-Nabi", start: "2026-08-26", end: "2026-08-26" },
  { name: "Iqbal Day", start: "2026-11-09", end: "2026-11-09" },
  { name: "Quaid-e-Azam Day", start: "2026-12-25", end: "2026-12-25" },
  { name: "Kashmir Solidarity Day", start: "2027-02-05", end: "2027-02-05" },
  { name: "Eid-ul-Fitr", start: "2027-03-10", end: "2027-03-12" },
  { name: "Pakistan Day", start: "2027-03-23", end: "2027-03-23" },
  { name: "Eid-ul-Adha", start: "2027-05-17", end: "2027-05-19" },
];

const EMPLOYEES = [
  { name: "Sophia Rahman", email: "sophia.rahman@legacymedia.com", jobTitle: "Senior Editor", department: "Editorial", location: "Head Office", birthday: "1994-11-18" },
  { name: "Zainab Al-Hassan", email: "zainab.hassan@legacymedia.com", jobTitle: "Product Designer", department: "Design & Creative", location: "Head Office", birthday: "1996-03-02" },
  { name: "Tariq Mansoor", email: "tariq.mansoor@legacymedia.com", jobTitle: "Video Producer", department: "Production", location: "Studio", birthday: "1991-07-21" },
  { name: "Elena Rostova", email: "elena.rostova@legacymedia.com", jobTitle: "Operations Lead", department: "Operations & People", location: "Head Office", birthday: "1988-11-04" },
  { name: "Farhan Siddiqui", email: "farhan.siddiqui@legacymedia.com", jobTitle: "Social Media Manager", department: "Digital & Social", location: "Remote", birthday: "1993-01-12" },
  { name: "Nadia Kamali", email: "nadia.kamali@legacymedia.com", jobTitle: "Account Director", department: "Sales & Partnerships", location: "Head Office", birthday: "1990-05-30" },
];

async function main() {
  const password = process.env.SEED_PASSWORD || "LegacyLeave!2026";
  const hash = await bcrypt.hash(password, 10);
  const year = 2026;

  for (const [i, t] of LEAVE_TYPES.entries()) {
    await db.leaveType.upsert({ where: { code: t.code }, update: {}, create: { ...t, sortOrder: i } });
  }

  if ((await db.holiday.count()) === 0) {
    await db.holiday.createMany({ data: HOLIDAYS.map((h) => ({ name: h.name, startDate: d(h.start), endDate: d(h.end) })) });
  }

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@legacymedia.com").toLowerCase();
  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { name: "Legacy Admin", email: adminEmail, passwordHash: hash, role: "ADMIN", jobTitle: "People & Culture", department: "Operations & People", location: "Head Office" },
  });

  const types = Object.fromEntries((await db.leaveType.findMany()).map((t) => [t.code, t]));
  const allUsers = [admin];

  if (process.env.SEED_DEMO_DATA !== "false") {
    for (const e of EMPLOYEES) {
      const u = await db.user.upsert({
        where: { email: e.email },
        update: {},
        create: { ...e, birthday: d(e.birthday), passwordHash: hash, joinedAt: d("2024-02-01") },
      });
      allUsers.push(u);
    }
  }

  for (const u of allUsers) {
    for (const t of Object.values(types).filter((t) => t.deductsQuota)) {
      await db.leaveBalance.upsert({
        where: { userId_leaveTypeId_year: { userId: u.id, leaveTypeId: t.id, year } },
        update: {},
        create: { userId: u.id, leaveTypeId: t.id, year, allocated: t.defaultQuota },
      });
    }
  }

  if (process.env.SEED_DEMO_DATA !== "false" && (await db.leaveRequest.count()) === 0) {
    const byEmail = Object.fromEntries(allUsers.map((u) => [u.email, u]));
    const req = (email: string, code: string, start: string, end: string, days: number, status: string, reason: string, extra: object = {}) =>
      db.leaveRequest.create({
        data: {
          userId: byEmail[email].id,
          leaveTypeId: types[code].id,
          startDate: d(start),
          endDate: d(end),
          days,
          status,
          reason,
          reviewedById: status === "PENDING" ? null : admin.id,
          reviewedAt: status === "PENDING" ? null : d(start),
          adminEmailSent: true,
          employeeEmailSent: status !== "PENDING",
          createdAt: new Date(Math.min(d(start).getTime() - 10 * 86_400_000, Date.now() - 3 * 86_400_000)),
          ...extra,
        },
      });

    await req("sophia.rahman@legacymedia.com", "ANNUAL", "2026-01-12", "2026-01-16", 5, "APPROVED", "Winter family trip.");
    await req("sophia.rahman@legacymedia.com", "SICK", "2026-04-06", "2026-04-06", 1, "APPROVED", "Seasonal flu.", { retrospective: true });
    await req("sophia.rahman@legacymedia.com", "CASUAL", "2026-07-09", "2026-07-09", 1, "APPROVED", "Home maintenance appointment.");
    await req("sophia.rahman@legacymedia.com", "ANNUAL", "2026-11-23", "2026-11-27", 5, "PENDING", "Year-end break with family.");
    await req("zainab.hassan@legacymedia.com", "ANNUAL", "2026-11-16", "2026-11-20", 5, "PENDING", "Attending sibling's graduation overseas and personal downtime.");
    await req("tariq.mansoor@legacymedia.com", "SICK", "2026-10-26", "2026-10-27", 2, "PENDING", "Seasonal flu and recuperation under medical advisory.", { retrospective: true });
    await req("elena.rostova@legacymedia.com", "BIRTHDAY", "2026-11-04", "2026-11-04", 1, "PENDING", "Annual celebratory personal day.");
    await req("farhan.siddiqui@legacymedia.com", "ANNUAL", "2026-10-28", "2026-10-30", 3, "APPROVED", "Short getaway.");
    await req("nadia.kamali@legacymedia.com", "CASUAL", "2026-09-14", "2026-09-14", 1, "REJECTED", "Personal errand.", { adminComment: "Client pitch scheduled that day — please pick another date." });
  }

  console.log(`Seeded. Admin: ${adminEmail} (password from SEED_PASSWORD)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
