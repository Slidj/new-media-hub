
// Add your Telegram ID here. You can get it from @userinfobot
export const ADMIN_IDS: number[] = [
    // Вставте сюди ваш ID, наприклад: 123456789
    // Якщо треба кілька адмінів, через кому: 123456789, 987654321
];

export const isAdmin = (userId?: number): boolean => {
    if (!userId) return false;
    return ADMIN_IDS.includes(userId);
};
