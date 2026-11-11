const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [svgPath, outPath, scale] = process.argv.slice(2);
  const svg = fs.readFileSync(svgPath, 'utf8');
  const m = svg.match(/width="(\d+)" height="(\d+)"/);
  const fd = path.resolve(__dirname, '../fonts');
  const ff = [['Bricolage Grotesque','Bric',[500,600,700,800]],['Inter','Inter',[400,500,600,700]]]
    .flatMap(([fam,p,ws]) => ws.map(w => `@font-face{font-family:'${fam}';font-weight:${w};src:url(file://${fd}/${p}-${w}.ttf)}`)).join('');
  const html = `<html><head><style>${ff}body{margin:0}</style></head><body>${svg}</body></html>`;
  const tmp = path.join(__dirname, 'tmp.html'); fs.writeFileSync(tmp, html);
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: +m[1], height: +m[2] }, deviceScaleFactor: +(scale||1) });
  await pg.goto('file://' + tmp); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300);
  await pg.screenshot({ path: outPath, fullPage: true });
  await b.close();
})();
