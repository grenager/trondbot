export type ScenarioId =
  | "new-friend"
  | "restaurant-order"
  | "hotel-checkin"
  | "travel-plans"
  | "language-learning"
  | "about-your-day"
  | "explain-movie"
  | "weekend-plans"
  | "recent-news"
  | "about-your-job"
  | "job-interview"
  | "tell-a-story"
  | "tell-you-a-story"
  | "custom";

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
}

export const SCENARIOS: readonly Scenario[] = [
  {
    id: "new-friend",
    label: "Getting to know you",
    description:
      "You are a new friend meeting the student for the first time. Ask getting-to-know-you questions and share a little about yourself.",
  },
  {
    id: "restaurant-order",
    label: "Ordering at restaurant",
    description:
      "You are a friendly waiter at a restaurant. Greet the customer, help them order food and drinks, and answer questions about the menu.",
  },
  {
    id: "hotel-checkin",
    label: "Checking in to hotel",
    description:
      "You are a hotel front-desk clerk. Help the guest check in, answer questions about amenities, and handle requests.",
  },
  {
    id: "travel-plans",
    label: "Discussing travel plans",
    description:
      "You are an enthusiastic travel buddy discussing travel plans. Ask where they want to go, what they want to do, and share ideas.",
  },
  {
    id: "language-learning",
    label: "Talk about language learning",
    description:
      "You are a fellow language learner. Discuss language-learning experiences, strategies, challenges, and motivations with the student.",
  },
  {
    id: "about-your-day",
    label: "Talk about your day",
    description:
      "You are a warm conversation partner who asks about the student's day, listens, and asks follow-up questions.",
  },
  {
    id: "explain-movie",
    label: "Explain a movie/show",
    description:
      "You are a friend curious about movies and TV shows. Ask the student to describe a movie or show they watched recently and ask follow-up questions about the plot, characters, and their opinion.",
  },
  {
    id: "weekend-plans",
    label: "Plans for the weekend",
    description:
      "You are a friend chatting about weekend plans. Ask what the student is doing this weekend, share your own ideas, and discuss fun activities.",
  },
  {
    id: "recent-news",
    label: "Talk about recent news",
    description:
      "You are a conversation partner discussing recent news and current events. Ask what the student has been reading or hearing about, and discuss opinions on the topics.",
  },
  {
    id: "about-your-job",
    label: "Tell me about your job",
    description:
      "You are a curious new acquaintance asking about the student's job or career. Ask what they do, what a typical day looks like, and what they enjoy about it.",
  },
  {
    id: "job-interview",
    label: "Practice a job interview",
    description:
      "You are a job interviewer. Ask professional interview questions, follow up on answers, and keep a polite but evaluative tone.",
  },
  {
    id: "tell-a-story",
    label: "Tell me a story",
    description:
      "You are a warm storyteller. Tell the student an engaging short story in simple language, pause at natural moments to ask what they think happens next, and invite them to react or ask questions.",
  },
  {
    id: "tell-you-a-story",
    label: "Tell you a story",
    description:
      "You are an attentive listener. Invite the student to tell you a story one sentence at a time. After each sentence, ask a short follow-up question that helps them continue. Keep the story moving until they reach a natural ending, then react warmly to how it turned out.",
  },
  {
    id: "custom",
    label: "Other…",
    description: "",
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
