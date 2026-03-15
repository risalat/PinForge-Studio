const FALLBACK_TITLE = "Breathtaking Lake House Exterior Ideas";

const HERO_TWO_SPLIT_MAX_WORDS = 5;
const HERO_TWO_SPLIT_MIN_WORDS = 3;

const TWO_WORD_SUFFIXES = [
  ["exterior", "ideas"],
  ["paint", "colors"],
  ["wall", "ideas"],
  ["color", "ideas"],
  ["decor", "ideas"],
] as const;

const ONE_WORD_SUFFIXES = new Set(["ideas", "colors", "decor", "styles", "looks"]);

const FILLER_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "of",
  "the",
  "to",
  "with",
]);

export function compactHeroTwoSplitTextTitle(title: string) {
  const words = splitWords(title);

  if (words.length === 0) {
    return FALLBACK_TITLE;
  }

  if (words.length <= HERO_TWO_SPLIT_MAX_WORDS) {
    return words.join(" ");
  }

  const normalizedWords = words.map(normalizeWord);

  for (const suffix of TWO_WORD_SUFFIXES) {
    if (normalizedWords.at(-2) === suffix[0] && normalizedWords.at(-1) === suffix[1]) {
      return [...words.slice(0, 3), ...words.slice(-2)].join(" ");
    }
  }

  if (ONE_WORD_SUFFIXES.has(normalizedWords.at(-1) ?? "")) {
    return [...words.slice(0, 4), words.at(-1)!].join(" ");
  }

  const filteredWords = words.filter((word, index) => {
    const normalizedWord = normalizedWords[index];
    return !FILLER_WORDS.has(normalizedWord) || index === 0 || index === words.length - 1;
  });

  const candidateWords = (filteredWords.length >= HERO_TWO_SPLIT_MIN_WORDS ? filteredWords : words).slice(
    0,
    HERO_TWO_SPLIT_MAX_WORDS,
  );

  while (
    candidateWords.length > HERO_TWO_SPLIT_MIN_WORDS &&
    FILLER_WORDS.has(normalizeWord(candidateWords.at(-1) ?? ""))
  ) {
    candidateWords.pop();
  }

  return candidateWords.join(" ");
}

export function isHeroTwoSplitTextTitleWithinLimit(title: string) {
  const wordCount = splitWords(title).length;
  return wordCount >= HERO_TWO_SPLIT_MIN_WORDS && wordCount <= HERO_TWO_SPLIT_MAX_WORDS;
}

function splitWords(title: string) {
  const safeTitle = title.trim() || FALLBACK_TITLE;
  return safeTitle.split(/\s+/).filter(Boolean);
}

function normalizeWord(word: string) {
  return word.toLowerCase().replace(/[^a-z]/g, "");
}
