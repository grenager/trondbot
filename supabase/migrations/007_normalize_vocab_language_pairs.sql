-- Fix vocab entries where word/translation were manually swapped but
-- source_language/target_language were not. After the fix, all rows
-- satisfy source_language < target_language (alphabetical canonical order).
-- Only the language columns are swapped; word/translation stay as-is since
-- the user already aligned those manually.

-- 1. Swap language columns on un-normalized rows
UPDATE public.vocab
SET
  source_language = target_language,
  target_language = source_language
WHERE source_language > target_language;

-- 2. Deduplicate: after swapping, some rows may collide on the new key.
--    Keep the most recently created entry for each (user, word, src, tgt).
DELETE FROM public.vocab
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, word, source_language, target_language) id
  FROM public.vocab
  ORDER BY user_id, word, source_language, target_language, created_at DESC
);

-- 3. Replace the unique index to match the normalized conflict key
DROP INDEX IF EXISTS public.vocab_user_translation_langs;
DROP INDEX IF EXISTS public.vocab_user_word_langs;

CREATE UNIQUE INDEX vocab_user_word_langs
  ON public.vocab (user_id, word, source_language, target_language);
