export type ScenarioId =
  | "restaurant-waiter"
  | "hotel-clerk"
  | "taxi-driver"
  | "ask-about-your-day"
  | "new-friend"
  | "vacation-plans"
  | "talk-about-school"
  | "job-interview";

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
}

export const SCENARIOS: readonly Scenario[] = [
  {
    id: "restaurant-waiter",
    label: "Restaurant waiter",
    description:
      "You are a friendly waiter at a restaurant. Greet the customer, help them order food and drinks, and answer questions about the menu.",
  },
  {
    id: "hotel-clerk",
    label: "Hotel clerk",
    description:
      "You are a hotel front-desk clerk. Help the guest check in, answer questions about amenities, and handle requests.",
  },
  {
    id: "taxi-driver",
    label: "Taxi driver",
    description:
      "You are a taxi driver. Greet the passenger, ask where they are going, make small talk, and discuss the route.",
  },
  {
    id: "ask-about-your-day",
    label: "Ask about your day",
    description:
      "You are a warm conversation partner who asks about the student's day, listens, and asks follow-up questions.",
  },
  {
    id: "new-friend",
    label: "New friend get to know you",
    description:
      "You are a new friend meeting the student for the first time. Ask getting-to-know-you questions and share a little about yourself.",
  },
  {
    id: "vacation-plans",
    label: "Tell me your vacation plans",
    description:
      "You are an enthusiastic travel buddy discussing vacation plans. Ask where they want to go, what they want to do, and share ideas.",
  },
  {
    id: "talk-about-school",
    label: "Talk about school",
    description:
      "You are a classmate or study partner talking about school — classes, teachers, homework, and campus life.",
  },
  {
    id: "job-interview",
    label: "Job interview",
    description:
      "You are a job interviewer. Ask professional interview questions, follow up on answers, and keep a polite but evaluative tone.",
  },
] as const;

const SCENARIO_IDS: ReadonlySet<ScenarioId> = new Set(
  SCENARIOS.map((scenario) => scenario.id),
);

export function isScenarioId(value: string): value is ScenarioId {
  return SCENARIO_IDS.has(value as ScenarioId);
}

export function getScenario(id: ScenarioId): Scenario {
  const scenario: Scenario | undefined = SCENARIOS.find(
    (entry) => entry.id === id,
  );
  if (!scenario) {
    throw new Error(`Unknown scenario: ${id}`);
  }
  return scenario;
}
