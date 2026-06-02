export function splitMessageWords(text: string): string[] {
  const words: RegExpMatchArray | null = text.match(/\S+/gu);
  return words ?? [];
}
