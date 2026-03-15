import type { SimTime } from "./types.js";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// 16 waking hours per day: 07:00 through 22:00
const WAKING_HOURS_PER_DAY = 16;

/**
 * Convert absolute tick number to SimTime.
 * Each tick = 1 waking hour. Night is skipped.
 * Tick 1 = Monday 07:00, Tick 16 = Monday 22:00, Tick 17 = Tuesday 07:00, etc.
 */
export function tickToTime(tick: number): SimTime {
  if (tick < 1) throw new Error(`Invalid tick: ${tick}`);

  const zeroTick = tick - 1;
  const dayNumber = Math.floor(zeroTick / WAKING_HOURS_PER_DAY) + 1;
  const hourIndex = zeroTick % WAKING_HOURS_PER_DAY;
  const hour = 7 + hourIndex; // 7-22

  const dayOfWeekIndex = (dayNumber - 1) % 7;
  const weekNumber = Math.floor((dayNumber - 1) / 7) + 1;

  return {
    tick,
    hour,
    dayOfWeek: DAY_NAMES[dayOfWeekIndex],
    dayNumber,
    weekNumber,
    isNight: false, // ticks are always waking hours
    timeLabel: `${DAY_NAMES[dayOfWeekIndex]}, ${hour.toString().padStart(2, "0")}:00`,
  };
}

export function isWeekday(time: SimTime): boolean {
  return !["Saturday", "Sunday"].includes(time.dayOfWeek);
}

export function isMorning(time: SimTime): boolean {
  return time.hour >= 7 && time.hour <= 10;
}

export function isEvening(time: SimTime): boolean {
  return time.hour >= 18;
}

export function isAfternoon(time: SimTime): boolean {
  return time.hour >= 12 && time.hour < 18;
}

/** Ticks per simulated day */
export function ticksPerDay(): number {
  return WAKING_HOURS_PER_DAY;
}
