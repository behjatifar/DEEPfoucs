/**
 * Timer Engine Module
 * Manages the countdown logic, state transitions (Work/Rest), and Audio Web API.
 */

const TimerEngine = (() => {
    let intervalId = null;
    
    // Web Audio API for soft beep notification
    const playBeep = () => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 note
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1);
    };

    // Calculate percentage for the circular UI progress
    const calculateProgress = (timeLeft, totalTime) => {
        return ((totalTime - timeLeft) / totalTime) * 360;
    };

    // Format seconds into MM:SS string
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Start/Resume countdown
    const start = (tickCallback, endCallback) => {
        if (intervalId) return;
        intervalId = setInterval(() => {
            const isDone = tickCallback();
            if (isDone) {
                stop();
                playBeep();
                endCallback();
            }
        }, 1000);
    };

    // Pause/Stop countdown
    const stop = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    return { start, stop, formatTime, calculateProgress, playBeep };
})();