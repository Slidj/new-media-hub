
// Web Audio API Controller for UI Sound Effects

class AudioController {
    private context: AudioContext | null = null;
    private isMuted: boolean = false;

    constructor() {
        // AudioContext is initialized lazily on first user interaction to comply with browser autoplay policies
    }

    private initContext() {
        if (!this.context) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.context = new AudioContextClass();
            }
        }
        // Resume context if suspended (common in browsers)
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    // Generic tone generator
    private playTone(
        freq: number, 
        type: OscillatorType, 
        duration: number, 
        vol: number = 0.1, 
        slideFreq: number | null = null
    ) {
        if (this.isMuted) return;
        this.initContext();
        if (!this.context) return;

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.context.currentTime);
        
        // Frequency slide effect (e.g., for "Whoosh" sounds)
        if (slideFreq) {
            osc.frequency.exponentialRampToValueAtTime(slideFreq, this.context.currentTime + duration);
        }

        // Volume Envelope (Avoid clicking sounds at start/end)
        gain.gain.setValueAtTime(0, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.context.currentTime + (duration * 0.1));
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.start();
        osc.stop(this.context.currentTime + duration);
    }

    // 1. Navigation Click (Tabs, Close, Back) - Crisp, high pitch
    public playClick() {
        this.playTone(600, 'sine', 0.05, 0.05);
    }

    // 2. Selection Pop (Movie Card) - Soft, bubbly
    public playPop() {
        this.playTone(300, 'triangle', 0.1, 0.05);
    }

    // 3. Tab Switch / Swipe - Sliding frequency
    public playSwipe() {
        this.playTone(400, 'sine', 0.15, 0.03, 600); // Pitch goes up
    }

    // 4. Heavy Action (PLAY Button) - Deep Bass Thud
    public playAction() {
        // Deep sine wave dropping in pitch
        this.playTone(150, 'sine', 0.4, 0.2, 40); 
    }

    // 5. Success / Notification
    public playSuccess() {
        if (this.isMuted) return;
        this.initContext();
        if (!this.context) return;
        
        // Simple major chord arpeggio
        const now = this.context.currentTime;
        [523.25, 659.25].forEach((freq, i) => { // C5, E5
            const osc = this.context!.createOscillator();
            const gain = this.context!.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.05, now + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
            osc.connect(gain);
            gain.connect(this.context!.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.2);
        });
    }

    public toggleMute(muted: boolean) {
        this.isMuted = muted;
    }
}

export const Audio = new AudioController();
