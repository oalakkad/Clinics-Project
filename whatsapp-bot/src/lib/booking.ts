/**
 * Booking engine + store.
 *
 * PHASE 1.5 LIMITATION: bookings live in module memory. On Vercel this survives
 * only as long as the lambda instance stays warm — fine for a demo Dr. Adel is
 * texting live, NOT fine for production. Phase 2 swaps `store` for Supabase;
 * everything below already goes through the BookingStore interface so the
 * swap touches this file only.
 */

import { CLINIC, findService, dentistFor, type ServiceId } from "./clinic";

export interface Booking {
  id: string;
  phone: string;
  patientName: string;
  serviceId: ServiceId;
  /** Slot start, as an absolute instant. */
  startsAt: Date;
  dentist: string;
  status: "confirmed" | "cancelled";
  createdAt: Date;
}

interface BookingStore {
  all(): Booking[];
  add(b: Booking): void;
  update(id: string, patch: Partial<Booking>): Booking | undefined;
  findById(id: string): Booking | undefined;
  findByPhone(phone: string): Booking[];
}

const memory: Booking[] = [];

const store: BookingStore = {
  all: () => memory,
  add: (b) => void memory.push(b),
  update(id, patch) {
    const b = memory.find((x) => x.id === id);
    if (!b) return undefined;
    Object.assign(b, patch);
    return b;
  },
  findById: (id) => memory.find((b) => b.id === id),
  findByPhone: (phone) =>
    memory.filter((b) => b.phone === phone && b.status === "confirmed").sort((a, z) => +a.startsAt - +z.startsAt),
};

/* ---------- Kuwait time helpers (UTC+3, no DST) ---------- */

const OFFSET_MS = CLINIC.utcOffsetHours * 60 * 60 * 1000;

/** Clock fields as they appear on a wall clock in Kuwait. */
function kuwaitParts(d: Date) {
  const shifted = new Date(d.getTime() + OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  };
}

/** Build an absolute instant from Kuwait wall-clock fields. */
function kuwaitDate(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - OFFSET_MS);
}

export function nowInKuwait() {
  return kuwaitParts(new Date());
}

/** "2026-07-19" (Kuwait calendar date). */
export function toDateKey(d: Date): string {
  const p = kuwaitParts(d);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** "3:30 PM" */
export function formatTime(d: Date): string {
  const { hour, minute } = kuwaitParts(d);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${String(minute).padStart(2, "0")} ${ampm}`;
}

const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "Sunday, 19 Jul at 3:30 PM" */
export function formatSlot(d: Date): string {
  const p = kuwaitParts(d);
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][p.month - 1];
  return `${WEEKDAYS_EN[p.weekday]}, ${p.day} ${month} at ${formatTime(d)}`;
}

/** Parse "2026-07-19" as a Kuwait calendar date. Returns null if malformed. */
function parseDateKey(key: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function isOpenOn(dateKey: string): boolean {
  const p = parseDateKey(dateKey);
  if (!p) return false;
  const weekday = kuwaitParts(kuwaitDate(p.year, p.month, p.day, 12)).weekday;
  return !(CLINIC.closedWeekdays as readonly number[]).includes(weekday);
}

/* ---------- Availability ---------- */

function slotsFor(dateKey: string): Date[] {
  const p = parseDateKey(dateKey);
  if (!p || !isOpenOn(dateKey)) return [];
  const out: Date[] = [];
  for (let h = CLINIC.openHour; h < CLINIC.closeHour; h++) {
    for (let m = 0; m < 60; m += CLINIC.slotMinutes) {
      out.push(kuwaitDate(p.year, p.month, p.day, h, m));
    }
  }
  return out;
}

function isTaken(slot: Date, serviceId: ServiceId): boolean {
  const svcMinutes = findService(serviceId)?.durationMinutes ?? 30;
  const start = slot.getTime();
  const end = start + svcMinutes * 60_000;
  return store.all().some((b) => {
    if (b.status !== "confirmed") return false;
    const bStart = b.startsAt.getTime();
    const bEnd = bStart + (findService(b.serviceId)?.durationMinutes ?? 30) * 60_000;
    return start < bEnd && bStart < end; // overlap
  });
}

export interface AvailabilityResult {
  dateKey: string;
  closed: boolean;
  slots: { iso: string; label: string }[];
}

/**
 * Free slots for a service, searching forward from `fromDateKey` (or today)
 * until `maxDays` open days have been collected.
 */
export function getAvailability(serviceId: ServiceId, fromDateKey?: string, maxDays = 3): AvailabilityResult[] {
  const start = fromDateKey ? parseDateKey(fromDateKey) : null;
  const base = start ? kuwaitDate(start.year, start.month, start.day, 12) : new Date();
  const results: AvailabilityResult[] = [];
  const now = Date.now();

  for (let dayOffset = 0; dayOffset < 21 && results.length < maxDays; dayOffset++) {
    const probe = new Date(base.getTime() + dayOffset * 86_400_000);
    const dateKey = toDateKey(probe);

    if (!isOpenOn(dateKey)) {
      // Surface an explicit "closed" entry only when the patient asked for that exact day.
      if (dayOffset === 0 && fromDateKey) results.push({ dateKey, closed: true, slots: [] });
      continue;
    }

    const free = slotsFor(dateKey)
      .filter((s) => s.getTime() > now + 60 * 60_000) // at least 1h of lead time
      .filter((s) => !isTaken(s, serviceId))
      .map((s) => ({ iso: s.toISOString(), label: formatSlot(s) }));

    if (free.length) results.push({ dateKey, closed: false, slots: free });
  }

  return results;
}

/* ---------- Mutations ---------- */

let counter = 0;
function newId(): string {
  counter += 1;
  return `D8-${Date.now().toString(36).toUpperCase().slice(-4)}${counter}`;
}

export function bookAppointment(args: {
  phone: string;
  patientName: string;
  serviceId: ServiceId;
  startsAtIso: string;
}): { ok: true; booking: Booking } | { ok: false; error: string } {
  const startsAt = new Date(args.startsAtIso);
  if (Number.isNaN(startsAt.getTime())) return { ok: false, error: "Invalid date/time." };
  if (startsAt.getTime() < Date.now()) return { ok: false, error: "That time is in the past." };
  if (!isOpenOn(toDateKey(startsAt))) return { ok: false, error: "The clinic is closed that day (Fridays are closed)." };
  if (isTaken(startsAt, args.serviceId)) return { ok: false, error: "That slot was just taken. Offer another time." };

  const booking: Booking = {
    id: newId(),
    phone: args.phone,
    patientName: args.patientName,
    serviceId: args.serviceId,
    startsAt,
    dentist: dentistFor(args.serviceId),
    status: "confirmed",
    createdAt: new Date(),
  };
  store.add(booking);
  return { ok: true, booking };
}

export function rescheduleAppointment(
  bookingId: string,
  newStartsAtIso: string,
): { ok: true; booking: Booking } | { ok: false; error: string } {
  const existing = store.findById(bookingId);
  if (!existing || existing.status !== "confirmed") return { ok: false, error: "Booking not found." };

  const startsAt = new Date(newStartsAtIso);
  if (Number.isNaN(startsAt.getTime())) return { ok: false, error: "Invalid date/time." };
  if (!isOpenOn(toDateKey(startsAt))) return { ok: false, error: "The clinic is closed that day (Fridays are closed)." };

  // Free the old slot before the overlap check so moving within the same hour works.
  existing.status = "cancelled";
  if (isTaken(startsAt, existing.serviceId)) {
    existing.status = "confirmed";
    return { ok: false, error: "That slot is taken. Offer another time." };
  }
  existing.status = "confirmed";

  const updated = store.update(bookingId, { startsAt })!;
  return { ok: true, booking: updated };
}

export function cancelAppointment(bookingId: string): { ok: true; booking: Booking } | { ok: false; error: string } {
  const existing = store.findById(bookingId);
  if (!existing || existing.status !== "confirmed") return { ok: false, error: "Booking not found." };
  const updated = store.update(bookingId, { status: "cancelled" })!;
  return { ok: true, booking: updated };
}

export function findBookingsByPhone(phone: string): Booking[] {
  return store.findByPhone(phone);
}

/** For the admin dashboard / debugging. */
export function allBookings(): Booking[] {
  return store.all();
}
