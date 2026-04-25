CREATE TABLE IF NOT EXISTS public.user_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    complement TEXT,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view own addresses" 
    ON public.user_addresses FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" 
    ON public.user_addresses FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" 
    ON public.user_addresses FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" 
    ON public.user_addresses FOR DELETE 
    USING (auth.uid() = user_id);
