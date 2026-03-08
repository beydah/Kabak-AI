const API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
const API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;
const STORAGE_KEY_RATE = 'kabak_usd_try_rate';
const STORAGE_KEY_TIMESTAMP = 'kabak_rate_timestamp';
const DEFAULT_RATE = 35.0;

export const F_Get_Exchange_Rate = async (): Promise<number> => {
    const cached_rate = localStorage.getItem(STORAGE_KEY_RATE);
    const cached_timestamp = localStorage.getItem(STORAGE_KEY_TIMESTAMP);

    if (cached_rate && cached_timestamp) {
        const last_fetch = new Date(parseInt(cached_timestamp, 10));
        const today = new Date();

        if (
            last_fetch.getDate() === today.getDate() &&
            last_fetch.getMonth() === today.getMonth() &&
            last_fetch.getFullYear() === today.getFullYear()
        ) {
            return parseFloat(cached_rate);
        }
    }

    try {
        if (!API_KEY) {
            console.warn('Exchange Rate API key is missing, using fallback rate.');
            return DEFAULT_RATE;
        }

        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Exchange Rate API Error: ${response.statusText}`);
        }

        const data = await response.json();
        if (data && data.conversion_rates && data.conversion_rates.TRY) {
            const rate = data.conversion_rates.TRY;
            localStorage.setItem(STORAGE_KEY_RATE, rate.toString());
            localStorage.setItem(STORAGE_KEY_TIMESTAMP, Date.now().toString());
            return rate;
        }

        throw new Error('Invalid API response format');
    } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
        return cached_rate ? parseFloat(cached_rate) : DEFAULT_RATE;
    }
};

export const F_Convert_Currency = (amount_usd: number, rate: number, currency: 'USD' | 'TRY'): string => {
    if (currency === 'USD') {
        return `$${amount_usd.toFixed(2)}`;
    }

    return `TRY ${(amount_usd * rate).toFixed(2)}`;
};

