const { open } = require('./harness');
const ROOT = require('path').join(__dirname, '..') + '/';
require('fs').mkdirSync(__dirname + '/shots', { recursive: true });
(async () => {
  const { browser, page, errors } = await open(ROOT + 'coaster_lab_v10_0.html');
  const r = await page.evaluate(() => window.__coasterDebug.v80.v86.corners(450,['loops','combo']));
  r.forEach(x => console.log(x)); console.log('passable corners:', r.filter(x => /PASSABLE/.test(x)).length, 'of', r.length, 'errors', errors.length); await browser.close();
})();
