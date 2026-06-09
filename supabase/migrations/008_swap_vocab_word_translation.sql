-- Fix word/translation column mismatch: word currently contains target-language
-- text and translation contains source-language text. Swap them so that
-- word corresponds to source_language and translation to target_language.
UPDATE public.vocab
SET
  word = translation,
  translation = word;
