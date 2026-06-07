-- Change vocab dedup key from source word to target word (translation).
-- Keeps one entry per learning-language word per user and language pair.
DROP INDEX IF EXISTS public.vocab_user_word_langs;

CREATE UNIQUE INDEX vocab_user_translation_langs
  ON public.vocab (user_id, translation, source_language, target_language);
