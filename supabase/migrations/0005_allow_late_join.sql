-- Allow Challenger to join even if match is preparing, starting, or playing
CREATE OR REPLACE FUNCTION join_match(p_room_code TEXT, p_player2_id UUID, p_player2_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_match matches%ROWTYPE;
BEGIN
    SELECT * INTO v_match
    FROM matches
    WHERE room_code = p_room_code
    FOR UPDATE;

    IF v_match.id IS NULL THEN
        RAISE EXCEPTION 'Room does not exist';
    END IF;

    IF v_match.status NOT IN ('waiting', 'preparing', 'starting', 'playing', 'lobby') THEN
        RAISE EXCEPTION 'Room is no longer joinable';
    END IF;

    IF v_match.player2_id IS NOT NULL AND v_match.player2_id != p_player2_id THEN
        RAISE EXCEPTION 'Room is already full';
    END IF;

    -- Update the match but don't overwrite status if it's already past preparing
    IF v_match.status = 'waiting' THEN
        v_match.status := 'preparing';
    END IF;

    UPDATE matches
    SET 
        player2_id = p_player2_id,
        player2_name = p_player2_name,
        status = v_match.status,
        updated_at = NOW()
    WHERE id = v_match.id
    RETURNING * INTO v_match;

    RETURN to_jsonb(v_match);
END;
$$;
