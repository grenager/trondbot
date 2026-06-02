const STORY_THEME_HINTS: readonly string[] = [
  "a kind neighbor who finds a mysterious map in an old book",
  "a small boat that washes ashore with something unexpected inside",
  "a garden where one plant grows differently from all the others",
  "a town festival where a shy child discovers a hidden talent",
  "a lost scarf that leads to a new friendship",
  "a lighthouse keeper who hears a strange but harmless sound at night",
  "a bakery that runs out of flour until someone clever saves the day",
  "a puppy who keeps bringing home small treasures from the park",
  "a rainy afternoon when a family builds the tallest blanket fort ever",
  "a hiking trail where a trail marker points in a surprising direction",
  "a music box that plays a melody nobody in town recognizes",
  "a snow day when friends invent a new game in the backyard",
  "a market stall where every customer leaves with a smile",
  "a young inventor whose first invention works in an amusing way",
  "a letter delivered to the wrong house that starts an adventure",
  "a treehouse club that solves a small mystery in the neighborhood",
  "a train ride where a passenger shares an interesting story",
  "a beach cleanup that uncovers something wonderful, not scary",
  "a camping trip where the funniest thing happens at breakfast",
  "a library book that has a handwritten note tucked inside",
] as const;

export function getRandomStoryThemeHint(): string {
  const index: number = Math.floor(Math.random() * STORY_THEME_HINTS.length);
  return STORY_THEME_HINTS[index] ?? STORY_THEME_HINTS[0];
}

export function buildTellMeAStoryTurnThemeHint(): string {
  const themeHint: string = getRandomStoryThemeHint();
  return themeHint;
}
