export type ImageQuality = 'low' | 'medium' | 'high';

export const getHeroQuality = (): ImageQuality => {
    return (localStorage.getItem('heroQuality') as ImageQuality) || 'medium';
};

export const getRowQuality = (): ImageQuality => {
    return (localStorage.getItem('rowQuality') as ImageQuality) || 'medium';
};

export const setHeroQuality = (q: ImageQuality) => {
    localStorage.setItem('heroQuality', q);
};

export const setRowQuality = (q: ImageQuality) => {
    localStorage.setItem('rowQuality', q);
};
