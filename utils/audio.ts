
// Audio Controller using external URLs
// This avoids local file corruption issues with Git LFS/Deployment.

const SOUND_URLS = {
    // Replace these with your direct links (Dropbox, GitHub Raw, etc.)
    click: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73467.mp3', // Short click
    pop: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c230d77d9e.mp3',   // Pop sound
    action: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3' // Success/Action chime
};

class AudioController {
    private sounds: Record<string, HTMLAudioElement> = {};
    private isMuted: boolean = false;
    private initialized: boolean = false;

    constructor() {
        // We initialize lazily or on import, but we wrap in try-catch to be safe
        if (typeof window !== 'undefined') {
            try {
                this.sounds = {
                    click: new window.Audio(SOUND_URLS.click),
                    pop: new window.Audio(SOUND_URLS.pop),
                    action: new window.Audio(SOUND_URLS.action),
                };

                // Pre-configure volume
                Object.values(this.sounds).forEach(sound => {
                    sound.volume = 0.6;
                    sound.crossOrigin = "anonymous"; // Enable CORS for external audio
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
