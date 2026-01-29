
// Add your Telegram ID here. You can get it from @userinfobot
export const ADMIN_IDS: number[] = [
    1365018137
];

export const isAdmin = (userId?: number): boolean => {
    if (!userId) return false;
    return ADMIN_IDS.includes(userId);
};
