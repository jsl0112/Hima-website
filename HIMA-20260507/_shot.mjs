import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:8090', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 截首屏
  await page.screenshot({ path: 'hero-top.png' });
  console.log('hero-top.png saved');

  // 滚动到 02 模块衔接处
  await page.evaluate(() => {
    const sec2 = document.getElementById('sec-2');
    if (sec2) sec2.scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'hero-sec2.png' });
  console.log('hero-sec2.png saved');

  await browser.close();
})();
