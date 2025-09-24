-- Create stocks table
CREATE TABLE IF NOT EXISTS stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    korean_name VARCHAR(100) NOT NULL,
    english_name VARCHAR(100),
    current_price DECIMAL(15,2),
    change_rate DECIMAL(8,4),
    change_amount DECIMAL(15,2),
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    market_type VARCHAR(20) DEFAULT 'KOSPI',
    last_updated TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for stocks table
CREATE INDEX idx_stocks_code ON stocks(code);
CREATE INDEX idx_stocks_is_primary ON stocks(is_primary);
CREATE INDEX idx_stocks_is_active ON stocks(is_active);
CREATE INDEX idx_stocks_display_order ON stocks(display_order);
CREATE INDEX idx_stocks_market_type ON stocks(market_type);
CREATE INDEX idx_stocks_last_updated ON stocks(last_updated);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_code VARCHAR(20) NOT NULL,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('UP', 'DOWN')),
    voting_date DATE NOT NULL,
    can_change_vote BOOLEAN DEFAULT true,
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    prediction_reason VARCHAR(500),
    is_result_calculated BOOLEAN DEFAULT false,
    is_correct BOOLEAN,
    points_earned INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Ensure one vote per user per stock per day
    UNIQUE(user_id, stock_code, voting_date)
);

-- Create indexes for votes table
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_stock_code ON votes(stock_code);
CREATE INDEX idx_votes_voting_date ON votes(voting_date);
CREATE INDEX idx_votes_vote_type ON votes(vote_type);
CREATE INDEX idx_votes_is_result_calculated ON votes(is_result_calculated);
CREATE INDEX idx_votes_user_voting_date ON votes(user_id, voting_date);
CREATE INDEX idx_votes_stock_voting_date ON votes(stock_code, voting_date);
CREATE INDEX idx_votes_created_at ON votes(created_at DESC);

-- Apply trigger to stocks table for updated_at
CREATE TRIGGER update_stocks_updated_at
    BEFORE UPDATE ON stocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to votes table for updated_at
CREATE TRIGGER update_votes_updated_at
    BEFORE UPDATE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial stock data for Korean market
INSERT INTO stocks (code, korean_name, english_name, is_primary, display_order, market_type) VALUES
    ('KOSPI', '코스피', 'KOSPI', true, 1, 'INDEX'),
    ('005930', '삼성전자', 'Samsung Electronics', false, 2, 'KOSPI'),
    ('000660', 'SK하이닉스', 'SK Hynix', false, 3, 'KOSPI'),
    ('035420', '네이버', 'NAVER', false, 4, 'KOSPI'),
    ('035720', '카카오', 'Kakao', false, 5, 'KOSPI'),
    ('051910', 'LG화학', 'LG Chem', false, 6, 'KOSPI'),
    ('006400', '삼성SDI', 'Samsung SDI', false, 7, 'KOSPI'),
    ('207940', '삼성바이오로직스', 'Samsung Biologics', false, 8, 'KOSPI'),
    ('068270', '셀트리온', 'Celltrion', false, 9, 'KOSPI'),
    ('028260', '삼성물산', 'Samsung C&T', false, 10, 'KOSPI'),
    ('066570', 'LG전자', 'LG Electronics', false, 11, 'KOSPI')
ON CONFLICT (code) DO NOTHING;

-- Create function to calculate vote statistics
CREATE OR REPLACE FUNCTION get_vote_statistics(
    p_stock_code VARCHAR(20),
    p_voting_date DATE
)
RETURNS TABLE (
    up_votes BIGINT,
    down_votes BIGINT,
    total_votes BIGINT,
    up_percentage DECIMAL(5,2),
    down_percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(CASE WHEN v.vote_type = 'UP' THEN 1 END) as up_votes,
        COUNT(CASE WHEN v.vote_type = 'DOWN' THEN 1 END) as down_votes,
        COUNT(*) as total_votes,
        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND((COUNT(CASE WHEN v.vote_type = 'UP' THEN 1 END) * 100.0 / COUNT(*)), 2)
            ELSE 0
        END as up_percentage,
        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND((COUNT(CASE WHEN v.vote_type = 'DOWN' THEN 1 END) * 100.0 / COUNT(*)), 2)
            ELSE 0
        END as down_percentage
    FROM votes v
    WHERE v.stock_code = p_stock_code
    AND v.voting_date = p_voting_date;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate user accuracy
CREATE OR REPLACE FUNCTION calculate_user_accuracy(p_user_id UUID)
RETURNS TABLE (
    total_predictions BIGINT,
    correct_predictions BIGINT,
    accuracy_rate DECIMAL(5,2),
    total_points INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_predictions,
        COUNT(CASE WHEN v.is_correct = true THEN 1 END) as correct_predictions,
        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND((COUNT(CASE WHEN v.is_correct = true THEN 1 END) * 100.0 / COUNT(*)), 2)
            ELSE 0
        END as accuracy_rate,
        COALESCE(SUM(v.points_earned), 0)::INTEGER as total_points
    FROM votes v
    WHERE v.user_id = p_user_id
    AND v.is_result_calculated = true;
END;
$$ LANGUAGE plpgsql;

-- Create view for daily voting dashboard
CREATE VIEW daily_voting_dashboard AS
SELECT
    s.code,
    s.korean_name,
    s.english_name,
    s.current_price,
    s.change_rate,
    s.change_amount,
    s.is_primary,
    s.display_order,
    s.last_updated,
    COALESCE(vote_stats.up_votes, 0) as up_votes,
    COALESCE(vote_stats.down_votes, 0) as down_votes,
    COALESCE(vote_stats.total_votes, 0) as total_votes,
    COALESCE(vote_stats.up_percentage, 0) as up_percentage,
    COALESCE(vote_stats.down_percentage, 0) as down_percentage
FROM stocks s
LEFT JOIN (
    SELECT
        v.stock_code,
        COUNT(CASE WHEN v.vote_type = 'UP' THEN 1 END) as up_votes,
        COUNT(CASE WHEN v.vote_type = 'DOWN' THEN 1 END) as down_votes,
        COUNT(*) as total_votes,
        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND((COUNT(CASE WHEN v.vote_type = 'UP' THEN 1 END) * 100.0 / COUNT(*)), 2)
            ELSE 0
        END as up_percentage,
        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND((COUNT(CASE WHEN v.vote_type = 'DOWN' THEN 1 END) * 100.0 / COUNT(*)), 2)
            ELSE 0
        END as down_percentage
    FROM votes v
    WHERE v.voting_date = CURRENT_DATE + INTERVAL '1 day'
    GROUP BY v.stock_code
) vote_stats ON s.code = vote_stats.stock_code
WHERE s.is_active = true
ORDER BY s.is_primary DESC, s.display_order ASC;