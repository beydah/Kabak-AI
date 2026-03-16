// Cookie Utils helper
// Strict naming convention applied.

export const F_Set_Cookie = (p_name: string, p_value: string, p_days: number = 7): void => {
    let expires = "";
    if (p_days) {
        const date = new Date();
        date.setTime(date.getTime() + (p_days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = p_name + "=" + (p_value || "") + expires + "; path=/; SameSite=Lax; Secure";
};

export const F_Get_Cookie = (p_name: string): string | null => {
    const name_eq = p_name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(name_eq) === 0) return c.substring(name_eq.length, c.length);
    }
    return null;
};

// Form Preferences specific keys
const PREF_KEYS = ['gender', 'age', 'body_type', 'fit', 'background', 'accessory'];

export const F_Save_Product_Preferences = (p_data: any) => {
    PREF_KEYS.forEach(key => {
        if (p_data[key]) {
            F_Set_Cookie(`pref_${key}`, p_data[key].toString(), 365);
        }
    });
};

export const F_Get_Product_Preferences = (): any => {
    const prefs: any = {};
    PREF_KEYS.forEach(key => {
        const val = F_Get_Cookie(`pref_${key}`);
        if (val) prefs[key] = val;
    });
    return prefs;
};
