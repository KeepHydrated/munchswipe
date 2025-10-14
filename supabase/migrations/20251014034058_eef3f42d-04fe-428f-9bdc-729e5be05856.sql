-- Create sessions table to track unique users without authentication
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_name TEXT
);

-- Create restaurant swipes table
CREATE TABLE public.restaurant_swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  restaurant_id TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  restaurant_data JSONB NOT NULL,
  liked BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(session_id, restaurant_id)
);

-- Create matches table to track when two sessions like the same restaurant
CREATE TABLE public.restaurant_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_1_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  session_2_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  restaurant_id TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  restaurant_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(session_1_id, session_2_id, restaurant_id)
);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_matches ENABLE ROW LEVEL SECURITY;

-- RLS policies for sessions (anyone can create and read their own)
CREATE POLICY "Anyone can create sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view sessions"
  ON public.sessions FOR SELECT
  USING (true);

-- RLS policies for restaurant_swipes
CREATE POLICY "Anyone can create swipes"
  ON public.restaurant_swipes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view swipes"
  ON public.restaurant_swipes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update their swipes"
  ON public.restaurant_swipes FOR UPDATE
  USING (true);

-- RLS policies for restaurant_matches
CREATE POLICY "Anyone can create matches"
  ON public.restaurant_matches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view matches"
  ON public.restaurant_matches FOR SELECT
  USING (true);

-- Function to check and create matches when a swipe is added
CREATE OR REPLACE FUNCTION public.check_restaurant_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process if the swipe is a like
  IF NEW.liked = true THEN
    -- Check if there's a matching like from a different session
    INSERT INTO public.restaurant_matches (session_1_id, session_2_id, restaurant_id, restaurant_name, restaurant_data)
    SELECT 
      LEAST(NEW.session_id, rs.session_id),
      GREATEST(NEW.session_id, rs.session_id),
      NEW.restaurant_id,
      NEW.restaurant_name,
      NEW.restaurant_data
    FROM public.restaurant_swipes rs
    WHERE rs.restaurant_id = NEW.restaurant_id
      AND rs.session_id != NEW.session_id
      AND rs.liked = true
    ON CONFLICT (session_1_id, session_2_id, restaurant_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to check for matches after each swipe
CREATE TRIGGER check_match_after_swipe
  AFTER INSERT ON public.restaurant_swipes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_restaurant_match();