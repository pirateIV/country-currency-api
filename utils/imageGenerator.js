
/**
 * imageGenerator.js
 * Safe wrapper: tries to use 'canvas'. If unavailable, writes a small placeholder PNG.
 */

const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'cache');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'summary.png');

function writePlaceholder() {
  // 1x1 transparent PNG
  const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
  const buf = Buffer.from(pngBase64, 'base64');
  fs.writeFileSync(outPath, buf);
  return Promise.resolve(outPath);
}

let Canvas = null;
try {
  Canvas = require('canvas');
} catch (e) {
  // canvas not available, use placeholder
  module.exports = {
    generateSummaryImage: async function(summary) {
      // Optionally write a simple JSON alongside
      try {
        fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
      } catch (err) {}
      return writePlaceholder();
    }
  };
  return;
}

// If canvas is available, implement a simple image generator
const { createCanvas, loadImage } = Canvas;

module.exports = {
  generateSummaryImage: async function(summary) {
    try {
      const width = 800;
      const height = 600;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0,0,width,height);

      // title
      ctx.fillStyle = '#000';
      ctx.font = '28px Sans';
      ctx.fillText('Countries Summary', 20, 40);

      // timestamp
      ctx.font = '16px Sans';
      ctx.fillText('Last refreshed: ' + (summary.last_refreshed_at || ''), 20, 70);

      // total
      ctx.font = '20px Sans';
      ctx.fillText('Total countries: ' + (summary.total_countries || 0), 20, 110);

      // top 5 list
      ctx.font = '18px Sans';
      const top = summary.top5 || [];
      for (let i = 0; i < Math.min(5, top.length); i++) {
        const t = top[i];
        ctx.fillText(`${i+1}. ${t.name} — ${t.estimated_gdp}`, 20, 150 + i*30);
      }

      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outPath, buffer);
      // also save JSON summary
      fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
      return outPath;
    } catch (err) {
      return writePlaceholder();
    }
  }
};
