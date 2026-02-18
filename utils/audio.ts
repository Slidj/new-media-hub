
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
                    this.masterGain.gain.value = 1.0; // Max volume for custom files (controlled by file loudness)
                    this.masterGain.connect(this.context.destination);
                }
            } catch (e) {
                console.error("Audio API not supported", e);
            }
        }
    }

    // Helper to fetch and decode audio files
    private async loadAudioFile(url: string): Promise<AudioBuffer | null> {
        if (!this.context) return null;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch ${url}`);
            const arrayBuffer = await response.arrayBuffer();
            return await this.context.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error(`Error loading sound ${url}:`, error);
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
                    console.debug("Audio resume failed", e);
                }
            }

            // 2. Load Custom Sounds (if not loaded yet)
            if (!this.areSoundsLoaded) {
                // Load in parallel
                const [tap, play] = await Promise.all([
                    this.loadAudioFile('./sounds/Tap.wav'),
                    this.loadAudioFile('./sounds/Play.wav')
                ]);
                this.tapBuffer = tap;
                this.playBuffer = play;
                this.areSoundsLoaded = true;
                console.log("Audio assets loaded");
            }
            
            // 3. Play silent buffer to force iOS audio engine wake-up
            const buffer = this.context.createBuffer(1, 1, 22050);
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.context.destination);
            source.start(0);
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

            // Optional: Individual volume control for this specific sound
            const gainNode = this.context.createGain();
            gainNode.gain.value = volume;

            source.connect(gainNode);
            gainNode.connect(this.masterGain);

            source.start(0);
        } catch (e) {
            console.error("Error playing sound buffer", e);
        }
    }

    // --- PUBLIC METHODS MAPPED TO FILES ---

    // 1. General Interaction (Tabs, Close, Back, Info) -> Tap.wav
    public playClick() {
        this.playBufferSource(this.tapBuffer, 0.8);
    }

    // 2. Selection (Movie Card) -> Tap.wav
    public playPop() {
        this.playBufferSource(this.tapBuffer, 0.8);
    }

    // 3. Navigation/Swipe -> Tap.wav
    public playSwipe() {
        this.playBufferSource(this.tapBuffer, 0.6); // Slightly quieter for rapid swipes
    }

    // 4. Success -> Tap.wav (or Play.wav if you prefer, but usually Tap)
    public playSuccess() {
        this.playBufferSource(this.tapBuffer, 1.0);
    }

    // 5. Heavy Action (PLAY BUTTON) -> Play.wav
    public playAction() {
        this.playBufferSource(this.playBuffer, 1.0);
    }

    public toggleMute(muted: boolean) {
        this.isMuted = muted;
    }
}

export const Audio = new AudioController();
