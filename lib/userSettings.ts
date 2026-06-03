export const USER_SETTINGS_KEY = "trondbot-user-settings";

export interface UserSettings {
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  reminderEnabled: false,
  reminderHour: 9,
  reminderMinute: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clampHour(value: number): number {
  return Math.min(23, Math.max(0, Math.floor(value)));
}

function clampMinute(value: number): number {
  return Math.min(59, Math.max(0, Math.floor(value)));
}

function parseUserSettings(raw: unknown): UserSettings {
  if (!isRecord(raw)) {
    return DEFAULT_SETTINGS;
  }

  const reminderEnabled: boolean =
    typeof raw.reminderEnabled === "boolean"
      ? raw.reminderEnabled
      : DEFAULT_SETTINGS.reminderEnabled;
  const reminderHour: number =
    typeof raw.reminderHour === "number"
      ? clampHour(raw.reminderHour)
      : DEFAULT_SETTINGS.reminderHour;
  const reminderMinute: number =
    typeof raw.reminderMinute === "number"
      ? clampMinute(raw.reminderMinute)
      : DEFAULT_SETTINGS.reminderMinute;

  return {
    reminderEnabled,
    reminderHour,
    reminderMinute,
  };
}

export function loadUserSettings(): UserSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const raw: string | null = window.localStorage.getItem(USER_SETTINGS_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    return parseUserSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveUserSettings(settings: UserSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const payload: UserSettings = {
      reminderEnabled: settings.reminderEnabled,
      reminderHour: clampHour(settings.reminderHour),
      reminderMinute: clampMinute(settings.reminderMinute),
    };
    window.localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota or privacy-mode errors.
  }
}
