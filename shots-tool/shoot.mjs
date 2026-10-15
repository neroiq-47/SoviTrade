import { chromium } from 'playwright';

const pages = ['/', '/pricing', '/app', '/app/bots', '/app/markets'];
const browser = await chromium.launch();
const page = await browser.newPage();
for (const p of pages) {
  await page.goto(`http://localhost:3000${p}`);
  await page.screenshot({ path: `screenshots${p.replace(/\//g, '-') || 'home'}.png`, fullPage: true });
}
await browser.close();
console.log('Screenshots done');
