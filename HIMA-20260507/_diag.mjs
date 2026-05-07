import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://localhost:8090', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const diag = await page.evaluate(() => {
  const vp = document.querySelector('.viewport');
  const st = document.getElementById('stage');
  const vpCS = getComputedStyle(vp);
  const stCS = getComputedStyle(st);
  return {
    innerHeight: window.innerHeight,
    scale: getComputedStyle(document.documentElement).getPropertyValue('--scale').trim(),
    viewport: {
      rect: vp.getBoundingClientRect().toJSON(),
      offsetTop: vp.offsetTop,
      height: vpCS.height,
      overflow: vpCS.overflow,
      display: vpCS.display,
      alignItems: vpCS.alignItems,
      justifyContent: vpCS.justifyContent,
    },
    stage: {
      rect: st.getBoundingClientRect().toJSON(),
      offsetTop: st.offsetTop,
      offsetLeft: st.offsetLeft,
      offsetHeight: st.offsetHeight,
      height: stCS.height,
      transform: stCS.transform,
      transformOrigin: stCS.transformOrigin,
      position: stCS.position,
    },
    heroSeg: (() => {
      const el = document.querySelector('.hero-seg');
      if (!el) return null;
      const cs = getComputedStyle(el);
      return {
        rect: el.getBoundingClientRect().toJSON(),
        offsetTop: el.offsetTop,
        backgroundImage: cs.backgroundImage,
        backgroundSize: cs.backgroundSize,
        backgroundPosition: cs.backgroundPosition,
        clipPath: cs.clipPath,
        opacity: cs.opacity,
        animationName: cs.animationName,
      };
    })(),
    // 段2 base-seg
    sec2Seg: (() => {
      const all = document.querySelectorAll('.base-seg');
      for (const el of all) {
        if (el.style.getPropertyValue('--seg-top') === '2640px') {
          const cs = getComputedStyle(el);
          return {
            rect: el.getBoundingClientRect().toJSON(),
            backgroundImage: cs.backgroundImage,
            clipPath: cs.clipPath,
            opacity: cs.opacity,
            zIndex: cs.zIndex,
          };
        }
      }
      return null;
    })(),
  };
});
console.log(JSON.stringify(diag, null, 2));
await browser.close();
