// Temporary smoke test for the booking engine — deleted after running.
import { getAvailability, bookAppointment, rescheduleAppointment, cancelAppointment, findBookingsByPhone, formatSlot, toDateKey } from "./src/lib/booking.js";

let pass = 0, fail = 0;
const check = (name: string, cond: boolean, extra = "") => {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
};

console.log("\n1. Availability returns real future slots");
const avail = getAvailability("cleaning");
check("returns at least one open day", avail.length > 0);
check("days have slots", avail.every(d => d.closed || d.slots.length > 0));
const first = avail[0]?.slots[0];
console.log(`     first free: ${first?.label}`);
check("slot iso parses", !!first && !Number.isNaN(new Date(first.iso).getTime()));
check("slot is in the future", !!first && new Date(first.iso).getTime() > Date.now());

console.log("\n2. Friday is closed");
// Find the next Friday and ask for it explicitly.
let probe = new Date();
for (let i = 0; i < 8; i++) {
  const d = new Date(Date.now() + i * 86400000);
  const kuwaitWeekday = new Date(d.getTime() + 3 * 3600000).getUTCDay();
  if (kuwaitWeekday === 5) { probe = d; break; }
}
const fridayKey = toDateKey(probe);
const fri = getAvailability("cleaning", fridayKey);
console.log(`     asked for ${fridayKey} (Friday)`);
check("Friday reported closed", fri[0]?.closed === true && fri[0].slots.length === 0);
check("still offers later open days", fri.some(d => !d.closed && d.slots.length > 0));

console.log("\n3. Booking works and holds the slot");
const slotIso = first!.iso;
const booked = bookAppointment({ phone: "96599999999", patientName: "Omar", serviceId: "cleaning", startsAtIso: slotIso });
check("booking succeeds", booked.ok === true);
if (booked.ok) console.log(`     ${booked.booking.id} · ${formatSlot(booked.booking.startsAt)} · ${booked.booking.dentist}`);

const dbl = bookAppointment({ phone: "96588888888", patientName: "Someone Else", serviceId: "cleaning", startsAtIso: slotIso });
check("double-booking rejected", dbl.ok === false, dbl.ok ? "(it allowed it!)" : "");

const after = getAvailability("cleaning");
const stillFree = after.flatMap(d => d.slots).some(s => s.iso === slotIso);
check("booked slot disappears from availability", !stillFree);

console.log("\n4. Lookup / reschedule / cancel");
const mine = findBookingsByPhone("96599999999");
check("lookup by phone finds it", mine.length === 1);
const id = mine[0]!.id;

const nextSlot = getAvailability("cleaning").flatMap(d => d.slots).find(s => s.iso !== slotIso)!;
const moved = rescheduleAppointment(id, nextSlot.iso);
check("reschedule succeeds", moved.ok === true);
if (moved.ok) console.log(`     moved to ${formatSlot(moved.booking.startsAt)}`);

const oldFreeAgain = getAvailability("cleaning").flatMap(d => d.slots).some(s => s.iso === slotIso);
check("old slot freed after reschedule", oldFreeAgain);

check("past date rejected", bookAppointment({ phone: "9", patientName: "x", serviceId: "checkup", startsAtIso: "2020-01-01T09:00:00.000Z" }).ok === false);
check("garbage date rejected", bookAppointment({ phone: "9", patientName: "x", serviceId: "checkup", startsAtIso: "not-a-date" }).ok === false);

const cancelled = cancelAppointment(id);
check("cancel succeeds", cancelled.ok === true);
check("cancelled booking gone from lookup", findBookingsByPhone("96599999999").length === 0);
check("cancelling twice rejected", cancelAppointment(id).ok === false);

console.log(`\n${fail === 0 ? "ALL PASS" : "FAILURES"} — ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
