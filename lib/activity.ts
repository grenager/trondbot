export const ACTIVITY_KEY = "trondbot-activity";

export interface ActivityData {
  activeDates: string[];
  totalMessages: number;
}

export interface ActivityStats {
  currentStreak: number;
  longestStreak: number;
  totalMessages: number;
  recentDates: string[];
}

const MAX_STORED_DATES = 365;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseActivityData(raw: unknown): ActivityData {
  if (!isRecord(raw)) {
    return { activeDates: [], totalMessages: 0 };
  }

  const activeDatesRaw: unknown = raw.activeDates;
  const totalMessagesRaw: unknown = raw.totalMessages;

  const activeDates: string[] = Array.isArray(activeDatesRaw)
    ? activeDatesRaw.filter((date): date is string => typeof date === "string")
    : [];
  const totalMessages: number =
    typeof totalMessagesRaw === "number" && Number.isFinite(totalMessagesRaw)
      ? Math.max(0, Math.floor(totalMessagesRaw))
      : 0;

  return {
    activeDates: [...new Set(activeDates)].sort().slice(-MAX_STORED_DATES),
    totalMessages,
  };
}

function loadActivityData(): ActivityData {
  if (typeof window === "undefined") {
    return { activeDates: [], totalMessages: 0 };
  }

  try {
    const raw: string | null = window.localStorage.getItem(ACTIVITY_KEY);
    if (!raw) {
      return { activeDates: [], totalMessages: 0 };
    }

    return parseActivityData(JSON.parse(raw));
  } catch {
    return { activeDates: [], totalMessages: 0 };
  }
}

function saveActivityData(data: ActivityData): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota or privacy-mode errors.
  }
}

function computeStreak(activeDates: ReadonlySet<string>, fromDate: Date): number {
  let streak = 0;
  const cursor = new Date(fromDate);

  while (true) {
    const dateKey: string = cursor.toISOString().slice(0, 10);
    if (!activeDates.has(dateKey)) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function computeLongestStreak(activeDates: readonly string[]): number {
  if (activeDates.length === 0) {
    return 0;
  }

  const sortedDates: string[] = [...activeDates].sort();
  let longest = 1;
  let current = 1;

  for (let index = 1; index < sortedDates.length; index += 1) {
    const previous = new Date(sortedDates[index - 1] ?? "");
    const currentDate = new Date(sortedDates[index] ?? "");
    previous.setDate(previous.getDate() + 1);
    const isConsecutive: boolean =
      previous.toISOString().slice(0, 10) ===
      currentDate.toISOString().slice(0, 10);

    if (isConsecutive) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

export function recordMessageSent(): void {
  const data: ActivityData = loadActivityData();
  const today: string = getTodayDateString();
  const activeDates: string[] = data.activeDates.includes(today)
    ? data.activeDates
    : [...data.activeDates, today].sort().slice(-MAX_STORED_DATES);

  saveActivityData({
    activeDates,
    totalMessages: data.totalMessages + 1,
  });
}

export function getActivityStats(): ActivityStats {
  const data: ActivityData = loadActivityData();
  const activeDateSet: ReadonlySet<string> = new Set(data.activeDates);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayKey: string = today.toISOString().slice(0, 10);
  const yesterdayKey: string = yesterday.toISOString().slice(0, 10);

  let currentStreak = 0;
  if (activeDateSet.has(todayKey)) {
    currentStreak = computeStreak(activeDateSet, today);
  } else if (activeDateSet.has(yesterdayKey)) {
    currentStreak = computeStreak(activeDateSet, yesterday);
  }

  return {
    currentStreak,
    longestStreak: computeLongestStreak(data.activeDates),
    totalMessages: data.totalMessages,
    recentDates: [...data.activeDates].reverse().slice(0, 14),
  };
}
