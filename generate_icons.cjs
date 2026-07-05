const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fill with transparent background
  ctx.clearRect(0, 0, size, size);

  // Draw rounded rect background
  ctx.fillStyle = '#10b981'; // Emerald 500
  ctx.beginPath();
  const radius = size * 0.2;
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // Draw "C" in center
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.6}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('C', size / 2, size / 2 + size * 0.05);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`./public/${filename}`, buffer);
}

generateIcon(192, 'icon-192x192.png');
generateIcon(512, 'icon-512x512.png');
