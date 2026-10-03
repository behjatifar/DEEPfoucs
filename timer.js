/**
 * Timer Engine Module (timer.js)
 * Uses delta-time (Date.now()) instead of simple interval counting
 * to prevent timer drift or freezing when browser tabs are inactive/minimized.
 */

const TimerEngine = (() => {
    let intervalId = null;
    let targetEndTime = null;
    let activeTickCallback = null;
    let activeEndCallback = null;

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

    // Pure function: Calculate degrees (0-360) for circular progress bar
    const calculateProgress = (timeLeft, totalTime) => {
        return ((totalTime - timeLeft) / totalTime) * 360;
    };

    // Pure function: Format seconds into MM:SS string
    const formatTime = (seconds) => {
        const safeSeconds = Math.max(0, seconds);
        const m = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
        const s = (safeSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Sync remaining time against real system clock
    const syncWithSystemClock = () => {
        if (!targetEndTime) return;

        const remainingMs = targetEndTime - Date.now();
        const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

        if (activeTickCallback) {
            activeTickCallback(remainingSeconds);
        }

        if (remainingSeconds <= 0) {
            const endCb = activeEndCallback;
            stop();
            playBeep();
            if (endCb) endCb();
        }
    };

    // Start countdown using exact target timestamp
    const start = (initialTimeLeftSeconds, tickCallback, endCallback) => {
        if (intervalId) return;

        targetEndTime = Date.now() + (initialTimeLeftSeconds * 1000);
        activeTickCallback = tickCallback;
        activeEndCallback = endCallback;

        // Run every 500ms for snappy UI updates and accurate drift correction
        intervalId = setInterval(syncWithSystemClock, 500);
    };

    // Stop/Pause countdown
    const stop = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        targetEndTime = null;
        activeTickCallback = null;
        activeEndCallback = null;
    };

    // Immediately recalculate time when user returns to the tab
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && intervalId) {
            syncWithSystemClock();
        }
    });

    return { start, stop, formatTime, calculateProgress, playBeep };
})();