
// Audio Controller using actual files from public/sfx/
// This ensures high-quality custom audio (no synthesis).

class AudioController {
    private sounds: Record<string, HTMLAudioElement> = {};
    private isMuted: boolean = false;
    private initialized: boolean = false;

    constructor() {
        // We initialize lazily or on import, but we wrap in try-catch to be safe
        if (typeof window !== 'undefined') {
            try {
                this.sounds = {
                    click: new window.Audio('sfx/click.mp3'),
                    pop: new window.Audio('sfx/pop.mp3'),
                    action: new window.Audio('sfx/action.mp3'),
                };

                // Pre-configure volume
                Object.values(this.sounds).forEach(sound => {
                    sound.volume = 0.6;
                    // Preload if possible
                    sound.load();
                });
            } catch (e) {
                console.error("Audio initialization failed:", e);
            }
        }
    }

    // Required for iOS/Mobile to "wake up" the audio engine
    public async unlock() {
        if (this.initialized) return;
        
        // Try to play and immediately pause one sound to unlock the context
        try {
            const silentPlay = this.sounds.click.play();
            if (silentPlay !== undefined) {
                silentPlay.then(() => {
                    this.sounds.click.pause();
                    this.sounds.click.currentTime = 0;
                    this.initialized = true;
                }).catch(() => {
                    // Auto-play might be blocked, wait for next interaction
                });
            }
        } catch (e) {
            // Ignore unlock errors
        }
    }

    private playSound(key: string) {
        if (this.isMuted) return;
        
        const sound = this.sounds[key];
        if (sound) {
            try {
                sound.currentTime = 0;
                const playPromise = sound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        // console.debug("Audio play blocked/failed:", error);
                    });
                }
            } catch (e) {
                // Ignore
            }
        }
    }

    // --- PUBLIC API MAPPED TO SPECIFIC FILES ---

    // 1. CLICK: General interactions, movies, tabs, closing
    public playClick() {
        this.playSound('click');
    }

    public playPop() {
        // Previously used 'pop' sound for movies, now user wants 'click' for movies
        this.playSound('click');
    }

    public playSwipe() {
        // Tabs navigation
        this.playSound('click');
    }

    public playSuccess() {
        // Success actions
        this.playSound('click');
    }

    // 2. ACTION: Only for "WATCH/PLAY" button
    public playAction() {
        this.playSound('action');
    }

    // 3. POP: Only for Notifications center
    public playNotification() {
        this.playSound('pop');
    }

    public toggleMute(muted: boolean) {
        this.isMuted = muted;
    }
}

export const Audio = new AudioController();
