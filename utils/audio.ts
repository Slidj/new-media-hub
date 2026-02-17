
// Web Audio API Controller for UI Sound Effects
// Optimized for Telegram WebApp and Mobile Browsers

class AudioController {
    private context: AudioContext | null = null;
    private isMuted: boolean = false;
    private masterGain: GainNode | null = null;

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
                    this.masterGain.gain.value = 0.5; // Default global volume (0.0 to 1.0)
                    this.masterGain.connect(this.context.destination);
                }
            } catch (e) {
                console.error("Audio API not supported", e);
            }
        }
    }

    // Critical: Call this on first user interaction (click/touch)
    public async unlock() {
        this.initContext();
        if (this.context) {
            if (this.context.state === 'suspended') {
                try {
                    await this.context.resume();
                } catch (e) {
                    console.debug("Audio resume failed", e);
                }
            }
            
            // Play a silent buffer to forcing the audio engine to wake up on iOS
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

    private async playTone(
        freq: number, 
        type: OscillatorType, 
        duration: number, 
        vol: number = 0.2, // Increased default volume
        slideFreq: number | null = null
    ) {
        if (this.isMuted) return;
        await this.ensureContext();
        if (!this.context || !this.masterGain) return;

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.context.currentTime);
        
        if (slideFreq) {
            // Smooth frequency slide
            osc.frequency.exponentialRampToValueAtTime(slideFreq, this.context.currentTime + duration);
        }

        // Volume Envelope (Avoid clicks)
        // Attack
        gain.gain.setValueAtTime(0, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.context.currentTime + 0.02); 
        // Decay
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.context.currentTime + duration);
        
        // Garbage collection helper
        setTimeout(() => {
            osc.disconnect();
            gain.disconnect();
        }, duration * 1000 + 100);
    }

    // 1. Navigation Click (Tabs, Close, Back) - Crisp, audible high pitch
    public playClick() {
        // Increased duration and volume
        this.playTone(800, 'sine', 0.15, 0.2);
    }

    // 2. Selection Pop (Movie Card) - Bubbly sound
    public playPop() {
        this.playTone(400, 'triangle', 0.15, 0.2);
    }

    // 3. Tab Switch / Swipe - "Whoosh" effect
    public playSwipe() {
        this.playTone(300, 'sine', 0.2, 0.15, 600);
    }

    // 4. Heavy Action (PLAY / Netflix "Ta-dum" simulation)
    public async playAction() {
        if (this.isMuted) return;
        await this.ensureContext();
        if (!this.context || !this.masterGain) return;

        const now = this.context.currentTime;
        
        // Play a chord (Root + Fifth) deep bass
        [55, 82.4].forEach(freq => {
            const osc = this.context!.createOscillator();
            const gain = this.context!.createGain();
            
            osc.type = 'sawtooth'; // Sawtooth for "richer" sound
            osc.frequency.setValueAtTime(freq, now);
            
            // Percussive envelope
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.3, now + 0.05); // Hard attack
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8); // Long decay

            // Lowpass filter to muffle the harsh sawtooth (makes it sound like a drum)
            const filter = this.context!.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain!);

            osc.start();
            osc.stop(now + 1.0);
        });
    }

    // 5. Success / Notification
    public playSuccess() {
        if (this.isMuted) return;
        // Simple major third
        this.playTone(523.25, 'sine', 0.2, 0.1); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.4, 0.1), 100); // E5
    }

    public toggleMute(muted: boolean) {
        this.isMuted = muted;
    }
}

export const Audio = new AudioController();
