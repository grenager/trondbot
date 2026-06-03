import type { LanguageCode } from "../types";
import type { ScenarioId } from "../scenarios";

export type ScenarioLabels = Record<ScenarioId, string>;

export type LanguageLabels = Record<LanguageCode, string>;

export interface Translations {
  close: string;
  closeDialog: string;
  cancel: string;
  start: string;
  ok: string;
  send: string;
  startNewChat: string;
  introText: string;
  comfortLanguageLabel: string;
  targetLanguageLabel: string;
  chatTopic: string;
  describeConversation: string;
  conversationPlaceholder: string;
  startChattingNow: string;
  freeCreditsNote: string;
  checking: string;
  perfect: string;
  corrected: string;
  original: string;
  acceptChanges: string;
  plusChat: string;
  customScenario: string;
  customScenarioDescription: string;
  buy100Credits: string;
  creditsAdded: string;
  creditsAddedMessage: (count: number) => string;
  getMoreCredits: string;
  youHaveMessagesRemaining: (count: number) => string;
  buyCreditsDescription: string;
  inviteFriend: string;
  inviteFriendDescription: string;
  getInviteLink: string;
  buyNow: string;
  copyLink: string;
  linkCopied: string;
  free: string;
  orDivider: string;
  yourInviteLink: string;
  creditsRemainingAria: (count: number) => string;
  creditsLabel: (count: number) => string;
  aboutTrondbot: string;
  aboutParagraph1: string;
  aboutParagraph2: string;
  aboutParagraph3: string;
  contactUs: string;
  starOnGitHub: string;
  stopAudio: string;
  playMessage: string;
  agentIsTyping: string;
  somethingWentWrong: string;
  failedToStartScenario: string;
  failedToSendMessage: string;
  customPrefix: (description: string) => string;
  accuracyCorrect: (percent: number) => string;
  confirmNewChatTitle: string;
  confirmNewChatMessage: string;
  confirmNewChatConfirm: string;
  confirmNewChatCancel: string;
  aboutTrondbotAria: string;
  newChatAria: string;
  acknowledgeCorrectionPlaceholder: string;
  typeMessagePlaceholder: string;
  lookupWordAria: string;
  lookupTitle: string;
  lookupDescription: string;
  lookupSourceLabel: (language: string) => string;
  lookupSourcePlaceholder: string;
  lookupAction: string;
  lookupTargetLabel: (language: string) => string;
  lookupInsert: string;
  lookupFailed: string;
  noCreditsForWordLookup: string;
  lookupNoResult: string;
  signIn: string;
  signUp: string;
  signOut: string;
  email: string;
  password: string;
  createAccount: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  authError: string;
  checkEmailConfirm: string;
  account: string;
  signedInAs: (email: string) => string;
  loadingAccount: string;
  appTitle: string;
  appDescription: string;
  scenarioLabels: ScenarioLabels;
  languageLabels: LanguageLabels;
}

const EN_SCENARIO_LABELS: ScenarioLabels = {
  "new-friend": "Getting to know you",
  "restaurant-order": "Ordering at restaurant",
  "hotel-checkin": "Checking in to hotel",
  "travel-plans": "Discussing travel plans",
  "language-learning": "Talk about language learning",
  "about-your-day": "Talk about your day",
  "explain-movie": "Explain a movie/show",
  "weekend-plans": "Plans for the weekend",
  "recent-news": "Talk about recent news",
  "about-your-job": "Tell me about your job",
  "job-interview": "Practice a job interview",
  "tell-a-story": "Tell me a story",
  "tell-you-a-story": "Tell you a story",
  custom: "Other…",
};

const EN_LANGUAGE_LABELS: LanguageLabels = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
  hi: "Hindi",
  ru: "Russian",
  nl: "Dutch",
  sv: "Swedish",
  no: "Norwegian",
};

export const en: Translations = {
  close: "Close",
  closeDialog: "Close dialog",
  cancel: "Cancel",
  start: "Start",
  ok: "OK",
  send: "Send",
  startNewChat: "Start a New Chat",
  introText:
    "The best way to learn a language is by just speaking it! Trondbot makes that possible by letting you chat with AI, giving you word-level translations of everything the agent says, as well as corrections on what you say.",
  comfortLanguageLabel: "My comfort language is",
  targetLanguageLabel: "I want to chat in",
  chatTopic: "Chat topic",
  describeConversation: "Describe the conversation",
  conversationPlaceholder:
    "e.g. I'm at the doctor's office describing my symptoms…",
  startChattingNow: "Start Chatting Now",
  freeCreditsNote:
    "First 100 messages are free. Get more by inviting a friend or buying credits.",
  checking: "Checking…",
  perfect: "Perfect!",
  corrected: "Corrected",
  original: "Original:",
  acceptChanges: "Accept Changes",
  plusChat: "+ Chat",
  customScenario: "Custom scenario",
  customScenarioDescription: "Describe the conversation you want to have.",
  buy100Credits: "100 credits for $2",
  creditsAdded: "Credits Added!",
  creditsAddedMessage: (count: number) =>
    `${count} credits have been added to your account. Happy chatting!`,
  getMoreCredits: "Get More Credits",
  youHaveMessagesRemaining: (count: number) =>
    `You have ${count} messages remaining.`,
  buyCreditsDescription: "Support Trondbot's development",
  inviteFriend: "Invite a Friend",
  inviteFriendDescription: "Share your link and get 100 free credits",
  getInviteLink: "Get Invite Link",
  buyNow: "Buy Now",
  copyLink: "Copy Link",
  linkCopied: "Copied!",
  free: "Free",
  orDivider: "or",
  yourInviteLink: "Your invite link",
  creditsRemainingAria: (count: number) => `${count} credits remaining`,
  creditsLabel: (count: number) => `${count} credits`,
  aboutTrondbot: "About Trondbot",
  aboutParagraph1:
    "My father's name was Trond, and he was Norwegian. As he got older, he tried to teach me Norwegian just by speaking patiently with me on the phone in a mix of Norwegian and English.",
  aboutParagraph2:
    "I kept thinking about how the best way to learn to speak a language is really just to try to use it, with lots of helpful feedback.",
  aboutParagraph3:
    "So I built Trondbot to help people learn languages in this simple way. It has certainly helped me learn Norwegian!",
  contactUs: "Contact us",
  starOnGitHub: "Star us on GitHub",
  stopAudio: "Stop audio",
  playMessage: "Play message",
  agentIsTyping: "Agent is typing",
  somethingWentWrong: "Something went wrong",
  failedToStartScenario: "Failed to start scenario",
  failedToSendMessage: "Failed to send message",
  customPrefix: (description: string) => `Custom: ${description}`,
  accuracyCorrect: (percent: number) => `${percent}% correct`,
  confirmNewChatTitle: "Start a new chat?",
  confirmNewChatMessage:
    "Starting a new chat will clear your current conversation.",
  confirmNewChatConfirm: "Start new chat",
  confirmNewChatCancel: "Keep current chat",
  aboutTrondbotAria: "About Trondbot",
  newChatAria: "New chat",
  acknowledgeCorrectionPlaceholder:
    "Acknowledge the correction to continue…",
  typeMessagePlaceholder: "Type a message…",
  lookupWordAria: "Look up a word",
  lookupTitle: "Word lookup",
  lookupDescription:
    "Look up a word in your comfort language and insert the translation into your message.",
  lookupSourceLabel: (language: string) => `Word in ${language}`,
  lookupSourcePlaceholder: "Type a word…",
  lookupAction: "Look up",
  lookupTargetLabel: (language: string) => `In ${language}`,
  lookupInsert: "Insert",
  lookupFailed: "Lookup failed. Please try again.",
  noCreditsForWordLookup: "No credits left for word lookup.",
  lookupNoResult: "No translation found.",
  signIn: "Sign in",
  signUp: "Sign up",
  signOut: "Sign out",
  email: "Email",
  password: "Password",
  createAccount: "Create account",
  alreadyHaveAccount: "Already have an account? Sign in",
  dontHaveAccount: "Don't have an account? Create one",
  authError: "Authentication failed. Please try again.",
  checkEmailConfirm: "Check your email to confirm your account.",
  account: "Account",
  signedInAs: (email: string) => `Signed in as ${email}`,
  loadingAccount: "Loading…",
  appTitle: "Trondbot",
  appDescription: "Simple language learning AI chat",
  scenarioLabels: EN_SCENARIO_LABELS,
  languageLabels: EN_LANGUAGE_LABELS,
};
