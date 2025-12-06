const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size, filename) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background - Dark gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Add subtle glow effect (scaled)
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = size * 0.06;

    // Draw ">_" symbol
    ctx.fillStyle = '#00d4ff';
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = size * 0.04;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw ">" symbol
    ctx.beginPath();
    ctx.moveTo(size * 0.25, size * 0.35);
    ctx.lineTo(size * 0.45, size * 0.5);
    ctx.lineTo(size * 0.25, size * 0.65);
    ctx.stroke();

    // Draw "_" symbol
    ctx.beginPath();
    ctx.moveTo(size * 0.5, size * 0.65);
    ctx.lineTo(size * 0.75, size * 0.65);
    ctx.stroke();

    // Remove shadow for border
    ctx.shadowBlur = 0;

    // Add border
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = size * 0.016;
    ctx.strokeRect(4, 4, size - 8, size - 8);

    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filename, buffer);
    
    return buffer;
}

// Generate 256x256 icon for ICO conversion
console.log('Generating 256x256 icon...');
generateIcon(256, 'app-icon-256.png');
console.log('✅ Icon generated: app-icon-256.png (256x256)');

// Also generate 512x512 for reference
console.log('Generating 512x512 icon...');
generateIcon(512, 'app-icon.png');
console.log('✅ Icon generated: app-icon.png (512x512)');
