-- Vocabulary list: stores words looked up by each user
CREATE TABLE public.vocab (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word text NOT NULL,
  translation text NOT NULL,
  source_language text NOT NULL,
  target_language text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX vocab_user_word_langs
  ON public.vocab (user_id, word, source_language, target_language);

ALTER TABLE public.vocab ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own vocab"
  ON public.vocab FOR ALL USING (auth.uid() = user_id);
