const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();
async function shot(svg,w,h,out,scale=1,circle=false){const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:scale});
await p.setContent(`<html><body style="margin:0;background:#888"><div style="width:${w}px;height:${h}px;${circle?'border-radius:50%;overflow:hidden':''}">${fs.readFileSync(svg,'utf8').replace(/width="\d+" height="\d+"/,`width="${w}" height="${h}"`)}</div></body></html>`);
await p.waitForTimeout(300);await p.screenshot({path:out});await p.close();}
await shot('logo.svg',800,800,'coaster-lab-logo-800.png');
await shot('logo.svg',1000,1000,'coaster-lab-logo-2000.png',2);
await shot('banner.svg',2560,1440,'coaster-lab-banner-2560x1440.png');
await b.close();})();
