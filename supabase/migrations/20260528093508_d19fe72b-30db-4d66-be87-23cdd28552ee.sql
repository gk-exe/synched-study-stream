CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  mood TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own messages"
ON public.chat_messages FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_chat_messages_user_created ON public.chat_messages(user_id, created_at);