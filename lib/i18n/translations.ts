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
  trialLimitUsedCredits: string;
  trialLimitSignInForMore: string;
  signInToContinue: string;
  signInForMoreMessages: string;
  signInPaywallFreeBadge: string;
  joinReferralTitle: string;
  joinReferralMessage: string;
  joinReferralTryGuest: string;
  guestScenarioNote: string;
  checking: string;
  perfect: string;
  corrected: string;
  original: string;
  acceptChanges: string;
  accept: string;
  reject: string;
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
  inviteFriendCreating: string;
  inviteFriendError: string;
  referralGraceMessage: string;
  referralPendingCap: string;
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
  signOut: string;
  email: string;
  signInWithGoogle: string;
  sendSignInCode: string;
  enterSignInCode: string;
  codeSentMessage: (email: string) => string;
  verifyCode: string;
  useDifferentEmail: string;
  authError: string;
  account: string;
  signedInAs: (email: string) => string;
  loadingAccount: string;
  openMenu: string;
  closeMenu: string;
  guestUser: string;
  navChat: string;
  navHistoryStreaks: string;
  navBuyCredits: string;
  navVocab: string;
  navSettings: string;
  navAbout: string;
  backToChat: string;
  settingsTitle: string;
  historyTitle: string;
  vocabTitle: string;
  vocabEmpty: string;
  wordList: string;
  flashcards: string;
  review: string;
  exportCsv: string;
  deleteWord: string;
  flipCard: string;
  nextCard: string;
  signInForVocab: string;
  vocabSaved: string;
  reminderEnabled: string;
  reminderEnabledDescription: string;
  reminderTime: string;
  displayName: string;
  displayNamePlaceholder: string;
  languageDefaults: string;
  languageDefaultsDescription: string;
  currentStreak: string;
  dayStreak: (count: number) => string;
  longestStreak: string;
  totalMessages: string;
  recentActivity: string;
  noActivityYet: string;
  currentSession: string;
  messagesSent: (count: number) => string;
  streakFire: string;
  streakStarted: string;
  streakCongrats: (days: number) => string;
  messagesToStreak: (remaining: number) => string;
  streakCompletedToday: string;
  saveSettings: string;
  settingsSaved: string;
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
    "Try 10 messages free. Sign in with Google for 100 more.",
  trialLimitUsedCredits: "You have used your 10 free credits.",
  trialLimitSignInForMore: "Sign in to get 100 more free credits.",
  signInToContinue: "Sign in to continue",
  signInForMoreMessages:
    "Sign in with Google to keep chatting. It is still free — no credit card, no payment, just 100 more messages and all conversation topics.",
  signInPaywallFreeBadge: "100% free · No credit card required",
  joinReferralTitle: "You've been invited!",
  joinReferralMessage:
    "Your friend invited you to practice languages on Trondbot. Sign in free to start chatting — they'll earn bonus credits when you join.",
  joinReferralTryGuest: "Or try 10 free messages first",
  guestScenarioNote:
    "Sign in to unlock more conversation topics. For now, try getting to know your chat partner.",
  checking: "Checking…",
  perfect: "Perfect!",
  corrected: "Corrected",
  original: "Original:",
  acceptChanges: "Accept Changes",
  accept: "Accept",
  reject: "Reject",
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
  inviteFriendDescription: "Get 20 credits now + 80 when they sign in",
  inviteFriendCreating: "Creating your invite link…",
  inviteFriendError: "Could not create your invite link. Please try again.",
  referralGraceMessage:
    "20 credits added! You'll earn 80 more when your friend signs in using your link.",
  referralPendingCap:
    "You have too many pending invites. Wait for friends to sign up.",
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
  signOut: "Sign out",
  email: "Email",
  signInWithGoogle: "Continue with Google",
  sendSignInCode: "Send sign-in code",
  enterSignInCode: "6-digit code",
  codeSentMessage: (email: string) => `We sent a sign-in code to ${email}.`,
  verifyCode: "Verify code",
  useDifferentEmail: "Use a different email",
  authError: "Authentication failed. Please try again.",
  account: "Account",
  signedInAs: (email: string) => `Signed in as ${email}`,
  loadingAccount: "Loading…",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  guestUser: "Guest",
  navChat: "Chat",
  navHistoryStreaks: "History & Streaks",
  navBuyCredits: "Refill Credits (Free!)",
  navVocab: "Vocabulary",
  navSettings: "Settings",
  navAbout: "About",
  backToChat: "Back to chat",
  settingsTitle: "Settings",
  historyTitle: "History & Streaks",
  vocabTitle: "Vocabulary",
  vocabEmpty: "No words saved yet. Tap on words in messages or use the dictionary to build your list.",
  wordList: "Word List",
  flashcards: "Flashcards",
  review: "Review",
  exportCsv: "Export CSV",
  deleteWord: "Delete word",
  flipCard: "Tap to flip",
  nextCard: "Next",
  signInForVocab: "Sign in to save and review your vocabulary.",
  vocabSaved: "Saved to your vocab list!",
  reminderEnabled: "Daily practice reminder",
  reminderEnabledDescription: "Get a reminder to practice each day",
  reminderTime: "Reminder time",
  displayName: "Display name",
  displayNamePlaceholder: "Your name",
  languageDefaults: "Language defaults",
  languageDefaultsDescription:
    "Change your comfort and target languages when starting a new chat.",
  currentStreak: "Current streak",
  dayStreak: (count: number) =>
    count === 1 ? "1 day" : `${count} days`,
  longestStreak: "Longest streak",
  totalMessages: "Total messages",
  recentActivity: "Recent activity",
  noActivityYet: "No activity yet. Start chatting to build your streak!",
  currentSession: "Current session",
  messagesSent: (count: number) => `${count} messages sent`,
  streakFire: "Streak",
  streakStarted: "Great job! You've started a streak!",
  streakCongrats: (days: number) =>
    days === 1
      ? "Great job! You've started a streak!"
      : `Great job, you're on a ${days}-day streak!`,
  messagesToStreak: (remaining: number) =>
    remaining === 1
      ? "1 more message to extend your streak today"
      : `${remaining} more messages to extend your streak today`,
  streakCompletedToday: "Streak extended! Keep chatting to practice more.",
  saveSettings: "Save settings",
  settingsSaved: "Settings saved",
  appTitle: "Trondbot",
  appDescription: "Simple language learning AI chat",
  scenarioLabels: EN_SCENARIO_LABELS,
  languageLabels: EN_LANGUAGE_LABELS,
};
