

// Web Audio API Controller for UI Sound Effects
// Uses custom assets: /public/sounds/Tap.wav and /public/sounds/Play.wav

class AudioController {
    private context: AudioContext | null = null;
    private isMuted: boolean = false;
    private masterGain: GainNode | null = null;

    // Buffers to store loaded audio data
    private tapBuffer: AudioBuffer | null = null;
    private playBuffer: AudioBuffer | null = null;
    private areSoundsLoaded: boolean = false;

    constructor() {
        // Lazy init
    }

    private initContext() {
        if (!this.context) {
            try {
                // Support standard and WebKit (iOS) audio contexts
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContextClass) {
                    this.context = new AudioContextClass();
                    
                    // Master Gain to control global volume
                    this.masterGain = this.context.createGain();
                    this.masterGain.gain.value = 1.0; 
                    this.masterGain.connect(this.context.destination);
                }
            } catch (e) {
                console.error("Audio API not supported", e);
            }
        }
    }

    // Helper to fetch and decode audio files
    private async loadAudioFile(filename: string): Promise<AudioBuffer | null> {
        if (!this.context) return null;
        
        try {
            // Get base URL from Vite env (handles './' or '/' correctly)
            // Fix: Cast import.meta to any to avoid TS error "Property 'env' does not exist on type 'ImportMeta'"
            const baseUrl = (import.meta as any).env.BASE_URL;
            
            // Construct path ensuring no double slashes
            // If baseUrl is './', path becomes './sounds/Tap.wav'
            const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
            const url = `${cleanBase}${filename}`;

            // Add timestamp to prevent stale 404 caching during dev
            const fetchUrl = `${url}?v=${new Date().getTime()}`;

            const response = await fetch(fetchUrl);
            
            if (!response.ok) {
                // Silently fail in dev console to avoid noise, 
                // knowing it might work in production or on second attempt
                return null;
            }

            const arrayBuffer = await response.arrayBuffer();
            return await this.context.decodeAudioData(arrayBuffer);
        } catch (error) {
            // console.error(`Error loading sound ${filename}`, error);
            return null;
        }
    }

    // Critical: Call this on first user interaction (click/touch)
    public async unlock() {
        this.initContext();
        if (this.context) {
            // 1. Resume Context if suspended (Browser Policy)
            if (this.context.state === 'suspended') {
                try {
                    await this.context.resume();
                } catch (e) {
                    // console.debug("Audio resume failed", e);
                }
            }

            // 2. Load Custom Sounds (if not loaded yet)
            if (!this.areSoundsLoaded) {
                // Pass path WITHOUT leading ./ or /
                // The loadAudioFile function prepends the correct BASE_URL
                const [tap, play] = await Promise.all([
                    this.loadAudioFile('sounds/Tap.wav'),
                    this.loadAudioFile('sounds/Play.wav')
                ]);
                
                if (tap) this.tapBuffer = tap;
                if (play) this.playBuffer = play;
                
                if (tap || play) {
                    this.areSoundsLoaded = true;
                }
            }
            
            // 3. Play silent buffer to force iOS audio engine wake-up
            try {
                const buffer = this.context.createBuffer(1, 1, 22050);
                const source = this.context.createBufferSource();
                source.buffer = buffer;
                source.connect(this.context.destination);
                source.start(0);
            } catch (e) {
                // Ignore errors during silent unlock
            }
        }
    }

    private async ensureContext() {
        if (!this.context) this.initContext();
        if (this.context?.state === 'suspended') {
            await this.context.resume().catch(() => {});
        }
    }

    private async playBufferSource(buffer: AudioBuffer | null, volume: number = 1.0) {
        if (this.isMuted || !buffer) return;
        await this.ensureContext();
        if (!this.context || !this.masterGain) return;

        try {
            const source = this.context.createBufferSource();
            source.buffer = buffer;

            const gainNode = this.context.createGain();
            gainNode.gain.value = volume;

            source.connect(gainNode);
            gainNode.connect(this.masterGain);

            source.start(0);
        } catch (e) {
            // Ignore play errors
        }
    }

    // --- PUBLIC METHODS ---

    public playClick() {
        this.playBufferSource(this.tapBuffer, 1.0);
    }

    public playPop() {
        this.playBufferSource(this.tapBuffer, 1.0);
    }

    public playSwipe() {
        this.playBufferSource(this.tapBuffer, 0.7); 
    }

    public playSuccess() {
        this.playBufferSource(this.tapBuffer, 1.0);
    }

    public playAction() {
        this.playBufferSource(this.playBuffer, 1.0);
    }

    public toggleMute(muted: boolean) {
        this.isMuted = muted;
    }
}

export const Audio = new AudioController();