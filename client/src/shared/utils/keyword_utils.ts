
/**
 * Utility for detecting gender-specific keywords in user queries.
 * Supports Turkish and English terms.
 */

export const MALE_KEYWORDS = ['erkek', 'man', 'male', 'boy', 'bey', 'bay'];
export const FEMALE_KEYWORDS = ['kadın', 'kadin', 'woman', 'female', 'girl', 'bayan'];

export const F_Detect_Gender_In_Query = (query: string): 'Erkek' | 'Kadın' | null => {
    if (!query) return null;

    const normalized = query.toLowerCase().trim();

    // Split into words to avoid partial matches (e.g. "kading" shouldn't match "kadin")
    // although "erkek" inside "erkekler" might be desired? 
    // The requirement said: "Check if ... exists as a standalone word".
    // We'll splits by spaces and punctuation.
    const words = normalized.split(/[\s,.-]+/);

    const isMale = words.some(w => MALE_KEYWORDS.includes(w));
    const isFemale = words.some(w => FEMALE_KEYWORDS.includes(w));

    if (isMale && isFemale) return null; // Ambiguous or both? Let's return null to fallback to text search or handle differently.
    // Or maybe prioritize one? For now, if both present, maybe just text search is safer.

    if (isMale) return 'Erkek';
    if (isFemale) return 'Kadın';

    return null;
};

/**
 * Strips gender keywords from the query to allow searching for the rest of the text.
 * e.g. "erkek ceket" -> "ceket"
 */
export const F_Remove_Gender_Keywords = (query: string): string => {
    if (!query) return '';

    let normalized = query.toLowerCase();

    [...MALE_KEYWORDS, ...FEMALE_KEYWORDS].forEach(keyword => {
        // Replace keyword if it's a whole word
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        normalized = normalized.replace(regex, '');
    });

    return normalized.replace(/\s+/g, ' ').trim();
};
