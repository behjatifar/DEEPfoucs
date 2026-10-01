/**
 * Simple Single-File Builder (build.js)
 * Run with: node build.js
 * Bundles index.html, style.css, and all JS modules into a single standalone HTML file.
 */
const fs = require('fs');
const path = require('path');

const buildSingleFile = () => {
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    const css = fs.readFileSync(path.join(__dirname, './style/style.css'), 'utf8');

    // 1. Replace external stylesheet link with inline <style>
    html = html.replace(
        /<link\s+rel="stylesheet"\s+href="style\.css"\s*\/?>/i,
        `<style>\n${css}\n</style>`
    );

    // 2. Replace each <script src="..."></script> with its inline content in exact order
    const scripts = ['storage.js', 'timer.js', 'exporter.js', 'app.js'];
    scripts.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const jsContent = fs.readFileSync(filePath, 'utf8');
            const scriptRegex = new RegExp(`<script\\s+src="${file}"\\s*><\\/script>`, 'i');
            html = html.replace(scriptRegex, `<script>\n${jsContent}\n</script>`);
        }
    });

    // 3. Output standalone file
    const outputPath = path.join(__dirname, 'DeepFocus-Standalone.html');
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log('✅ Standalone file created successfully: DeepFocus-Standalone.html');
};

buildSingleFile();