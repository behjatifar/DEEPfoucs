/**
 * Report Exporter Module
 * Generates a high-resolution PNG daily report card using native HTML5 Canvas API.
 * Follows functional programming principles with isolated rendering rules.
 */

const ReportExporter = (() => {
    // --- 1. Visual & Layout Configuration Rules ---
    const CONFIG = {
        width: 800,
        baseHeight: 440,
        rowHeight: 58,
        padding: 50,
        colors: {
            bg: '#0a0a0a',
            cardBg: 'rgba(255, 255, 255, 0.04)',
            cardBorder: 'rgba(255, 255, 255, 0.1)',
            textMain: '#f3f4f6',
            textMuted: '#9ca3af',
            accentBlue: '#3b82f6',
            accentPurple: '#8b5cf6',
            successGreen: '#10b981'
        },
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };

    // Pure helper to mask spoiler tasks or truncate overly long task strings
    const formatTaskText = (task, globalSpoiler) => {
        if (task.isSpoiler || globalSpoiler) {
            return '•••••••••••••••••••••••• (Spoiler)';
        }
        return task.text.length > 52 ? `${task.text.substring(0, 52)}...` : task.text;
    };

    // Helper to draw rounded rectangles on Canvas
    const drawRoundedRect = (ctx, x, y, width, height, radius, fillStyle, strokeStyle = null) => {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }
        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    };

    // Draw Gemini-inspired ambient background glows
    const drawAmbientBackground = (ctx, width, height) => {
        ctx.fillStyle = CONFIG.colors.bg;
        ctx.fillRect(0, 0, width, height);

        // Top-left Electric Blue Glow
        const blueGlow = ctx.createRadialGradient(width * 0.15, height * 0.15, 20, width * 0.15, height * 0.15, 420);
        blueGlow.addColorStop(0, 'rgba(59, 130, 246, 0.28)');
        blueGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = blueGlow;
        ctx.fillRect(0, 0, width, height);

        // Bottom-right Deep Purple Glow
        const purpleGlow = ctx.createRadialGradient(width * 0.85, height * 0.85, 20, width * 0.85, height * 0.85, 420);
        purpleGlow.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
        purpleGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = purpleGlow;
        ctx.fillRect(0, 0, width, height);
    };

    // --- 2. Main Canvas Generator & Downloader ---
    const exportDailyReport = ({ works = [], stats = {}, dates = {}, spoilerAllWorks = false }) => {
        const completedTasks = works.filter(task => task.completed);
        const taskCount = Math.max(1, completedTasks.length);
        const canvasHeight = CONFIG.baseHeight + (taskCount * CONFIG.rowHeight);

        const canvas = document.createElement('canvas');
        // Use 2x scale for crisp Retina/High-DPI image quality
        const scale = 2;
        canvas.width = CONFIG.width * scale;
        canvas.height = canvasHeight * scale;

        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);

        // 1. Background & Outer Glass Card
        drawAmbientBackground(ctx, CONFIG.width, canvasHeight);
        drawRoundedRect(
            ctx,
            CONFIG.padding,
            CONFIG.padding,
            CONFIG.width - CONFIG.padding * 2,
            canvasHeight - CONFIG.padding * 2,
            24,
            CONFIG.colors.cardBg,
            CONFIG.colors.cardBorder
        );

        const innerX = CONFIG.padding + 36;
        const innerWidth = CONFIG.width - (CONFIG.padding + 36) * 2;
        let currentY = CONFIG.padding + 55;

        // 2. Header Title
        ctx.fillStyle = CONFIG.colors.textMain;
        ctx.font = `700 28px ${CONFIG.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.fillText('Deep Focus — Daily Report', innerX, currentY);

        // 3. Dates (Shamsi & Gregorian)
        currentY += 34;
        ctx.fillStyle = CONFIG.colors.textMain;
        ctx.font = `500 16px ${CONFIG.fontFamily}`;
        ctx.fillText(`${dates.shamsi || ''}   |   ${dates.gregorian || ''}`, innerX, currentY);

        // 4. Stats Summary Badges (Pomodoros & Completed Count)
        currentY += 30;
        const badgeWidth = (innerWidth - 20) / 2;
        
        // Pomodoro Stat Box
        drawRoundedRect(ctx, innerX, currentY, badgeWidth, 85, 16, 'rgba(59, 130, 246, 0.12)', 'rgba(59, 130, 246, 0.35)');
        ctx.fillStyle = CONFIG.colors.accentBlue;
        ctx.font = `700 32px ${CONFIG.fontFamily}`;
        ctx.fillText(`${stats.pomodorosCompleted || 0}`, innerX + 24, currentY + 48);
        ctx.fillStyle = CONFIG.colors.textMuted;
        ctx.font = `500 14px ${CONFIG.fontFamily}`;
        ctx.fillText('Pomodoros Completed', innerX + 24, currentY + 70);

        // Completed Tasks Stat Box
        const secondBadgeX = innerX + badgeWidth + 20;
        drawRoundedRect(ctx, secondBadgeX, currentY, badgeWidth, 85, 16, 'rgba(139, 92, 246, 0.12)', 'rgba(139, 92, 246, 0.35)');
        ctx.fillStyle = CONFIG.colors.accentPurple;
        ctx.font = `700 32px ${CONFIG.fontFamily}`;
        ctx.fillText(`${completedTasks.length}`, secondBadgeX + 24, currentY + 48);
        ctx.fillStyle = CONFIG.colors.textMuted;
        ctx.font = `500 14px ${CONFIG.fontFamily}`;
        ctx.fillText('Tasks Accomplished', secondBadgeX + 24, currentY + 70);

        // 5. Completed Tasks List Section
        currentY += 125;
        ctx.fillStyle = CONFIG.colors.textMuted;
        ctx.font = `600 15px ${CONFIG.fontFamily}`;
        ctx.fillText('COMPLETED WORKS', innerX, currentY);

        currentY += 20;

        if (completedTasks.length === 0) {
            drawRoundedRect(ctx, innerX, currentY, innerWidth, 46, 12, 'rgba(255, 255, 255, 0.02)');
            ctx.fillStyle = CONFIG.colors.textMuted;
            ctx.font = `italic 15px ${CONFIG.fontFamily}`;
            ctx.fillText('No completed tasks recorded yet today.', innerX + 20, currentY + 28);
        } else {
            completedTasks.forEach((task) => {
                drawRoundedRect(ctx, innerX, currentY, innerWidth, 46, 12, 'rgba(0, 0, 0, 0.3)', 'rgba(255, 255, 255, 0.06)');

                // Checkmark icon
                ctx.fillStyle = CONFIG.colors.successGreen;
                ctx.font = `700 16px ${CONFIG.fontFamily}`;
                ctx.fillText('✓', innerX + 18, currentY + 29);

                // Task text (auto-detects Persian/RTL or English/LTR characters)
                const displayText = formatTaskText(task, spoilerAllWorks);
                ctx.fillStyle = CONFIG.colors.textMain;
                ctx.font = `500 16px ${CONFIG.fontFamily}`;
                ctx.fillText(displayText, innerX + 45, currentY + 29);

                currentY += CONFIG.rowHeight;
            });
        }

        // 6. Trigger Instant PNG Download
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const safeDate = new Date().toISOString().slice(0, 10);
        link.download = `deep-focus-report-${safeDate}.png`;
        link.href = dataUrl;
        link.click();
    };

    return { exportDailyReport };
})();