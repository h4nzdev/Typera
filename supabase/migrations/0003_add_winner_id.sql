-- Add winner_id to track who won the race
ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner_id UUID;

-- Add missing DELETE policy so leaveMatch() and the unload keepalive actually work!
DROP POLICY IF EXISTS "Allow public delete" ON matches;
CREATE POLICY "Allow public delete" ON matches FOR DELETE USING (true);

-- Function to atomically claim the win
CREATE OR REPLACE FUNCTION finish_match(p_match_id UUID, p_winner_id UUID)
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

    -- Only allow claiming win if the match is still playing
    IF v_match.status != 'playing' THEN
         RAISE EXCEPTION 'Match is no longer playing';
    END IF;

    v_match.status := 'finished';
    v_match.winner_id := p_winner_id;

    UPDATE matches
    SET 
        status = v_match.status,
        winner_id = v_match.winner_id,
        updated_at = NOW()
    WHERE id = p_match_id
    RETURNING * INTO v_match;

    RETURN to_jsonb(v_match);
END;
$$;
