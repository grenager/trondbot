export const ACTIVITY_KEY = "trondbot-activity";
export const STREAK_THRESHOLD = 10;

export interface ActivityData {
  dailyCounts: Record<string, number>;
  totalMessages: number;
  /** Legacy field – migrated on first load. */
  activeDates?: string[];
}

export interface ActivityStats {
  currentStreak: number;
  longestStreak: number;
  totalMessages: number;
  recentDates: string[];
}

export interface TodayProgress {
  sent: number;
  threshold: number;
  remaining: number;
  completed: boolean;
}

const MAX_STORED_DAYS = 365;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function migrateLegacy(raw: Record<string, unknown>): ActivityData {
  const legacyDates: unknown = raw.activeDates;
  const totalMessagesRaw: unknown = raw.totalMessages;
  const totalMessages: number =
    typeof totalMessagesRaw === "number" && Number.isFinite(totalMessagesRaw)
      ? Math.max(0, Math.floor(totalMessagesRaw))
      : 0;

  if (Array.isArray(legacyDates) && !raw.dailyCounts) {
    const dailyCounts: Record<string, number> = {};
    for (const date of legacyDates) {
      if (typeof date === "string") {
        dailyCounts[date] = STREAK_THRESHOLD;
      }
    }
    return { dailyCounts, totalMessages };
  }

  return { dailyCounts: {}, totalMessages };
}

function parseActivityData(raw: unknown): ActivityData {
  if (!isRecord(raw)) {
    return { dailyCounts: {}, totalMessages: 0 };
  }

  if (!raw.dailyCounts && Array.isArray(raw.activeDates)) {
    return migrateLegacy(raw);
  }

  const dailyCountsRaw: unknown = raw.dailyCounts;
  const totalMessagesRaw: unknown = raw.totalMessages;

  const dailyCounts: Record<string, number> = {};
  if (isRecord(dailyCountsRaw)) {
    const entries: string[] = Object.keys(dailyCountsRaw)
      .sort()
      .slice(-MAX_STORED_DAYS);
    for (const key of entries) {
      const val: unknown = dailyCountsRaw[key];
      if (typeof val === "number" && Number.isFinite(val) && val > 0) {
        dailyCounts[key] = Math.floor(val);
      }
    }
  }

  const totalMessages: number =
    typeof totalMessagesRaw === "number" && Number.isFinite(totalMessagesRaw)
      ? Math.max(0, Math.floor(totalMessagesRaw))
      : 0;

  return { dailyCounts, totalMessages };
}

function loadActivityData(): ActivityData {
  if (typeof window === "undefined") {
    return { dailyCounts: {}, totalMessages: 0 };
  }

  try {
    const raw: string | null = window.localStorage.getItem(ACTIVITY_KEY);
    if (!raw) {
      return { dailyCounts: {}, totalMessages: 0 };
    }
    return parseActivityData(JSON.parse(raw));
  } catch {
    return { dailyCounts: {}, totalMessages: 0 };
  }
}

function saveActivityData(data: ActivityData): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const trimmed: Record<string, number> = {};
    const keys: string[] = Object.keys(data.dailyCounts)
      .sort()
      .slice(-MAX_STORED_DAYS);
    for (const key of keys) {
      const count: number | undefined = data.dailyCounts[key];
      if (count !== undefined && count > 0) {
        trimmed[key] = count;
      }
    }
    window.localStorage.setItem(
      ACTIVITY_KEY,
      JSON.stringify({ dailyCounts: trimmed, totalMessages: data.totalMessages }),
    );
  } catch {
    // Ignore quota or privacy-mode errors.
  }
}

function streakDatesSet(dailyCounts: Record<string, number>): ReadonlySet<string> {
  const set = new Set<string>();
  for (const [date, count] of Object.entries(dailyCounts)) {
    if (count >= STREAK_THRESHOLD) {
      set.add(date);
    }
  }
  return set;
}

function computeStreak(qualifiedDates: ReadonlySet<string>, fromDate: Date): number {
  let streak = 0;
  const cursor = new Date(fromDate);

  while (true) {
    const dateKey: string = cursor.toISOString().slice(0, 10);
    if (!qualifiedDates.has(dateKey)) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function computeLongestStreak(dailyCounts: Record<string, number>): number {
  const qualifiedDates: string[] = Object.entries(dailyCounts)
    .filter(([, count]) => count >= STREAK_THRESHOLD)
    .map(([date]) => date)
    .sort();

  if (qualifiedDates.length === 0) {
    return 0;
  }

  let longest = 1;
  let current = 1;

  for (let index = 1; index < qualifiedDates.length; index += 1) {
    const previous = new Date(qualifiedDates[index - 1]!);
    const currentDate = new Date(qualifiedDates[index]!);
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

export function recordMessageSent(): TodayProgress {
  const data: ActivityData = loadActivityData();
  const today: string = getTodayDateString();
  const previousCount: number = data.dailyCounts[today] ?? 0;
  const newCount: number = previousCount + 1;

  data.dailyCounts[today] = newCount;
  data.totalMessages += 1;

  saveActivityData(data);

  const remaining: number = Math.max(0, STREAK_THRESHOLD - newCount);
  return {
    sent: newCount,
    threshold: STREAK_THRESHOLD,
    remaining,
    completed: newCount >= STREAK_THRESHOLD,
  };
}

export function getTodayProgress(): TodayProgress {
  const data: ActivityData = loadActivityData();
  const today: string = getTodayDateString();
  const count: number = data.dailyCounts[today] ?? 0;
  const remaining: number = Math.max(0, STREAK_THRESHOLD - count);
  return {
    sent: count,
    threshold: STREAK_THRESHOLD,
    remaining,
    completed: count >= STREAK_THRESHOLD,
  };
}

export function getActivityStats(): ActivityStats {
  const data: ActivityData = loadActivityData();
  const qualified: ReadonlySet<string> = streakDatesSet(data.dailyCounts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayKey: string = today.toISOString().slice(0, 10);
  const yesterdayKey: string = yesterday.toISOString().slice(0, 10);

  let currentStreak = 0;
  if (qualified.has(todayKey)) {
    currentStreak = computeStreak(qualified, today);
  } else if (qualified.has(yesterdayKey)) {
    currentStreak = computeStreak(qualified, yesterday);
  }

  const allDates: string[] = Object.keys(data.dailyCounts).sort().reverse();

  return {
    currentStreak,
    longestStreak: computeLongestStreak(data.dailyCounts),
    totalMessages: data.totalMessages,
    recentDates: allDates.slice(0, 14),
  };
}
