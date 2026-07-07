const fs = require('fs');
let code = fs.readFileSync('src/utils/pdf.ts', 'utf-8');

code = code.replace(
  /doc\.addImage\(settings\.logo, 'JPEG', 30, y, 20, 20\);/,
  `// Infer image type from data URL or default to PNG
      const imgType = settings.logo.includes('image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(settings.logo, imgType, 30, y, 20, 20);`
);

fs.writeFileSync('src/utils/pdf.ts', code);
