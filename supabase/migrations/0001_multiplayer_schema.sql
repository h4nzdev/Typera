-- Setup uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(6) UNIQUE NOT NULL,
    player1_id UUID NOT NULL,
    player2_id UUID,
    player1_name VARCHAR(255),
    player2_name VARCHAR(255),
    player1_ready BOOLEAN DEFAULT FALSE,
    player2_ready BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'waiting', -- waiting, preparing, countdown, playing, finished, cancelled
    game_mode VARCHAR(50) DEFAULT 'race',
    category VARCHAR(50) DEFAULT 'all',
    round_number INTEGER DEFAULT 1,
    challenge_words JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and Realtime
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access (since Supabase Auth is not used here)
CREATE POLICY "Allow public select" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON matches FOR UPDATE USING (true);

-- Function for atomic join match
CREATE OR REPLACE FUNCTION join_match(p_room_code VARCHAR(6), p_player2_id UUID, p_player2_name VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_match matches%ROWTYPE;
BEGIN
    -- Find and lock the row to prevent race conditions
    SELECT * INTO v_match
    FROM matches
    WHERE room_code = p_room_code
    FOR UPDATE;

    IF v_match.id IS NULL THEN
        RAISE EXCEPTION 'Room does not exist';
    END IF;

    IF v_match.status != 'waiting' THEN
        RAISE EXCEPTION 'Room is no longer joinable';
    END IF;

    IF v_match.player2_id IS NOT NULL AND v_match.player2_id != p_player2_id THEN
        RAISE EXCEPTION 'Room is already full';
    END IF;

    -- Update the match
    UPDATE matches
    SET 
        player2_id = p_player2_id,
        player2_name = p_player2_name,
        status = 'preparing',
        updated_at = NOW()
    WHERE id = v_match.id
    RETURNING * INTO v_match;

    RETURN to_jsonb(v_match);
END;
$$;

-- Function for toggling ready state safely
CREATE OR REPLACE FUNCTION toggle_ready(p_match_id UUID, p_player_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_match matches%ROWTYPE;
BEGIN
    SELECT * INTO v_match
    FROM matches
    WHERE id = p_match_id
    FOR UPDATE;

    IF v_match.id IS NULL THEN
         RAISE EXCEPTION 'Match not found';
    END IF;

    IF v_match.player1_id = p_player_id THEN
         v_match.player1_ready := TRUE;
    ELSIF v_match.player2_id = p_player_id THEN
         v_match.player2_ready := TRUE;
    ELSE
         RAISE EXCEPTION 'Player not in match';
    END IF;

    -- Check if both ready and we are preparing
    IF v_match.player1_ready AND v_match.player2_ready AND v_match.status = 'preparing' THEN
         v_match.status := 'countdown';
    END IF;

    UPDATE matches
    SET 
        player1_ready = v_match.player1_ready,
        player2_ready = v_match.player2_ready,
        status = v_match.status,
        updated_at = NOW()
    WHERE id = p_match_id
    RETURNING * INTO v_match;

    RETURN to_jsonb(v_match);
END;
$$;

-- Setup trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_matches_modtime ON matches;
CREATE TRIGGER update_matches_modtime
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    
-- Turn on Realtime for matches table
BEGIN;
  -- remove the supabase_realtime publication if it exists to avoid errors, or just alter it
  -- we can just add table safely
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE matches;
COMMIT;
