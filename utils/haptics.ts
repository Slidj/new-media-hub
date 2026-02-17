
// Centralized Haptic Feedback Utility for Telegram Mini App
// Docs: https://core.telegram.org/bots/webapps#hapticfeedback

export const Haptics = {
    // Light vibration: Good for tabs, menus, close buttons
    light: () => {
        if (shouldTrigger()) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
    },

    // Medium vibration: Good for opening content, toggles, likes
    medium: () => {
        if (shouldTrigger()) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }
    },

    // Heavy vibration: Good for primary actions like PLAY, or Delete
    heavy: () => {
        if (shouldTrigger()) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
        }
    },

    // Selection change: Very subtle, good for sliders or segmented controls
    selection: () => {
        if (shouldTrigger()) {
            window.Telegram.WebApp.HapticFeedback.selectionChanged();
        }
    },

    // Success notification (usually two quick pulses)
    success: () => {
        if (shouldTrigger()) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    },

    // Error notification (usually distinct vibration pattern)
    error: () => {
        if (shouldTrigger()) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
    }
};

// Helper to check availability
const shouldTrigger = (): boolean => {
    return (
        typeof window !== 'undefined' &&
        !!window.Telegram?.WebApp?.HapticFeedback &&
        window.Telegram.WebApp.isVersionAtLeast('6.1')
    );
};
