
// Add your Telegram ID here. You can get it from @userinfobot
export const ADMIN_IDS: number[] = [
    1365018137
];

export const TESTER_IDS: number[] = [
    // Add Dev Tester IDs here
    999999
];

export const isAdmin = (userId?: number): boolean => {
    if (!userId) return false;
    return ADMIN_IDS.includes(userId);
};

export const isTester = (userId?: number): boolean => {
    if (!userId) return false;
    return TESTER_IDS.includes(userId) || ADMIN_IDS.includes(userId);
};
