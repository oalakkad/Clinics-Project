/**
 * Clinic configuration. In Phase 2 this comes from Supabase keyed by clinic_id
 * so the same bot serves multiple clinics — keep everything tenant-specific here.
 */

export const CLINIC = {
  name: "Dental 8 Clinic",
  nameAr: "عيادة دنتال 8",
  tagline: "Smile Great with Dental 8",
  address: "Al-Bahar Centre, 1st Floor, Tunis Street, Hawally, Kuwait",
  addressAr: "مجمع البحار، الدور الأول، شارع تونس، حولي، الكويت",
  phone: "+965 2264 9292",
  email: "info@Dental8Clinic.com",
  instagram: "@dental8clinic",
  since: 2006,
  /** Kuwait is UTC+3 year-round (no daylight saving). */
  utcOffsetHours: 3,
  /** 0=Sun … 5=Fri … 6=Sat. Friday is the weekend in Kuwait. */
  closedWeekdays: [5],
  openHour: 9,
  closeHour: 21,
  slotMinutes: 30,
} as const;

export type ServiceId =
  | "checkup"
  | "cleaning"
  | "filling"
  | "whitening"
  | "orthodontics"
  | "implant"
  | "root_canal"
  | "kids"
  | "emergency";

export interface Service {
  id: ServiceId;
  en: string;
  ar: string;
  durationMinutes: number;
}

export const SERVICES: Service[] = [
  { id: "checkup", en: "Check-up & consultation", ar: "فحص واستشارة", durationMinutes: 30 },
  { id: "cleaning", en: "Cleaning & scaling", ar: "تنظيف وتلميع", durationMinutes: 45 },
  { id: "filling", en: "Filling / restoration", ar: "حشوة / ترميم", durationMinutes: 60 },
  { id: "whitening", en: "Teeth whitening", ar: "تبييض الأسنان", durationMinutes: 60 },
  { id: "orthodontics", en: "Orthodontics (braces/aligners)", ar: "تقويم الأسنان", durationMinutes: 45 },
  { id: "implant", en: "Dental implant consultation", ar: "استشارة زراعة الأسنان", durationMinutes: 45 },
  { id: "root_canal", en: "Root canal treatment", ar: "علاج جذور", durationMinutes: 90 },
  { id: "kids", en: "Kids dentistry", ar: "طب أسنان الأطفال", durationMinutes: 30 },
  { id: "emergency", en: "Emergency / dental pain", ar: "طوارئ / ألم أسنان", durationMinutes: 30 },
];

export function findService(idOrName: string): Service | undefined {
  const q = idOrName.trim().toLowerCase();
  return (
    SERVICES.find((s) => s.id === q) ??
    SERVICES.find((s) => s.en.toLowerCase().includes(q) || s.ar.includes(idOrName.trim()))
  );
}

/** Dentists, from the clinic's public site. */
export const DENTISTS = [
  { name: "Dr. Adel Ashkanani", role: "Founder · DMD, AEGD, M.Sc.", services: ["checkup", "implant"] },
  { name: "Dr. Simi", role: "Hygienist", services: ["cleaning"] },
  { name: "Dr. Dana", role: "Orthodontics", services: ["orthodontics"] },
  { name: "Dr. Murtada", role: "Endodontics", services: ["root_canal"] },
  { name: "Dr. Aiza", role: "Pediatric Dentistry", services: ["kids"] },
  { name: "Dr. Becahra", role: "Cosmetic Dentistry", services: ["whitening"] },
  { name: "Dr. Charles", role: "Prosthodontics", services: ["filling"] },
  { name: "Dr. AlQattan", role: "Oral Surgery", services: ["emergency"] },
] as const;

export function dentistFor(serviceId: ServiceId): string {
  const match = DENTISTS.find((d) => (d.services as readonly string[]).includes(serviceId));
  return match?.name ?? "one of our specialists";
}
