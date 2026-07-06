import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('FAILED_RESOURCE:', response.status(), response.url());
    }
  });

  console.log("Navigating to http://0.0.0.0:3000...");
  await page.goto('http://0.0.0.0:3000', { waitUntil: 'load', timeout: 30000 });
  
  await new Promise(r => setTimeout(r, 10000));
  
  console.log("Taking screenshot...");
  await page.screenshot({ path: 'screenshot.png' });
  
  await browser.close();
})();

