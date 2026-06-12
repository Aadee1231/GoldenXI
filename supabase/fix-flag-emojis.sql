-- =========================================================
-- Fix: Corrupted flag_emoji values in teams table
-- =========================================================
-- The seed data had encoding issues causing flags to appear as ��
-- This migration updates flag_emoji with proper UTF-8 values

UPDATE public.teams SET flag_emoji = '🇲🇽' WHERE code = 'MEX';
UPDATE public.teams SET flag_emoji = '🇿🇦' WHERE code = 'RSA';
UPDATE public.teams SET flag_emoji = '🇰🇷' WHERE code = 'KOR';
UPDATE public.teams SET flag_emoji = '🇨🇿' WHERE code = 'CZE';

UPDATE public.teams SET flag_emoji = '🇨🇦' WHERE code = 'CAN';
UPDATE public.teams SET flag_emoji = '🇧🇦' WHERE code = 'BIH';
UPDATE public.teams SET flag_emoji = '🇶🇦' WHERE code = 'QAT';
UPDATE public.teams SET flag_emoji = '🇨🇭' WHERE code = 'SUI';

UPDATE public.teams SET flag_emoji = '🇧🇷' WHERE code = 'BRA';
UPDATE public.teams SET flag_emoji = '🇲🇦' WHERE code = 'MAR';
UPDATE public.teams SET flag_emoji = '🇭🇹' WHERE code = 'HAI';
UPDATE public.teams SET flag_emoji = '🏴󠁧󠁢󠁳󠁣󠁴󠁿' WHERE code = 'SCO';

UPDATE public.teams SET flag_emoji = '🇺🇸' WHERE code = 'USA';
UPDATE public.teams SET flag_emoji = '🇵🇾' WHERE code = 'PAR';
UPDATE public.teams SET flag_emoji = '🇦🇺' WHERE code = 'AUS';
UPDATE public.teams SET flag_emoji = '🇹🇷' WHERE code = 'TUR';

UPDATE public.teams SET flag_emoji = '🇩🇪' WHERE code = 'GER';
UPDATE public.teams SET flag_emoji = '🇨🇼' WHERE code = 'CUW';
UPDATE public.teams SET flag_emoji = '🇨🇮' WHERE code = 'CIV';
UPDATE public.teams SET flag_emoji = '🇪🇨' WHERE code = 'ECU';

UPDATE public.teams SET flag_emoji = '🇳🇱' WHERE code = 'NED';
UPDATE public.teams SET flag_emoji = '🇯🇵' WHERE code = 'JPN';
UPDATE public.teams SET flag_emoji = '🇸🇪' WHERE code = 'SWE';
UPDATE public.teams SET flag_emoji = '🇹🇳' WHERE code = 'TUN';

UPDATE public.teams SET flag_emoji = '🇧🇪' WHERE code = 'BEL';
UPDATE public.teams SET flag_emoji = '🇪🇬' WHERE code = 'EGY';
UPDATE public.teams SET flag_emoji = '🇮🇷' WHERE code = 'IRN';
UPDATE public.teams SET flag_emoji = '🇳🇿' WHERE code = 'NZL';

UPDATE public.teams SET flag_emoji = '🇪🇸' WHERE code = 'ESP';
UPDATE public.teams SET flag_emoji = '🇨🇻' WHERE code = 'CPV';
UPDATE public.teams SET flag_emoji = '🇸🇦' WHERE code = 'KSA';
UPDATE public.teams SET flag_emoji = '🇺🇾' WHERE code = 'URU';

UPDATE public.teams SET flag_emoji = '🇫🇷' WHERE code = 'FRA';
UPDATE public.teams SET flag_emoji = '🇸🇳' WHERE code = 'SEN';
UPDATE public.teams SET flag_emoji = '🇮🇶' WHERE code = 'IRQ';
UPDATE public.teams SET flag_emoji = '🇳🇴' WHERE code = 'NOR';

UPDATE public.teams SET flag_emoji = '🇦🇷' WHERE code = 'ARG';
UPDATE public.teams SET flag_emoji = '🇩🇿' WHERE code = 'ALG';
UPDATE public.teams SET flag_emoji = '🇦🇹' WHERE code = 'AUT';
UPDATE public.teams SET flag_emoji = '🇯🇴' WHERE code = 'JOR';

UPDATE public.teams SET flag_emoji = '🇵🇹' WHERE code = 'POR';
UPDATE public.teams SET flag_emoji = '🇨🇩' WHERE code = 'COD';
UPDATE public.teams SET flag_emoji = '🇺🇿' WHERE code = 'UZB';
UPDATE public.teams SET flag_emoji = '🇨🇴' WHERE code = 'COL';

UPDATE public.teams SET flag_emoji = '🏴󠁧󠁢󠁥󠁮󠁧󠁿' WHERE code = 'ENG';
UPDATE public.teams SET flag_emoji = '🇭🇷' WHERE code = 'CRO';
UPDATE public.teams SET flag_emoji = '🇬🇭' WHERE code = 'GHA';
UPDATE public.teams SET flag_emoji = '🇵🇦' WHERE code = 'PAN';

-- Verify the update
SELECT code, name, flag_emoji FROM public.teams ORDER BY code;
