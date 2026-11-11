const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [svgPath, outPath] = process.argv.slice(2);
  const svg = fs.readFileSync(svgPath, 'utf8');
  const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/);
  const fd = path.resolve(__dirname, '../fonts');
  const ff = [['Bricolage Grotesque','Bric',[500,600,700,800]],['Inter','Inter',[400,500,600,700]]]
    .flatMap(([fam,p,ws]) => ws.map(x => `@font-face{font-family:'${fam}';font-weight:${x};src:url(file://${fd}/${p}-${x}.ttf)}`)).join('');
  const tmp = path.join(__dirname, 'tmp-pdf.html');
  fs.writeFileSync(tmp, `<html><head><style>${ff}@page{size:${w}px ${h}px;margin:0}html,body{margin:0}svg{display:block}</style></head><body>${svg}</body></html>`);
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto('file://' + tmp); await pg.evaluate(() => document.fonts.ready);
  await pg.pdf({ path: outPath, width: w + 'px', height: h + 'px', printBackground: true, pageRanges: '1' });
  await b.close();
})();
