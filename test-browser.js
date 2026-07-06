import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST_FAILED:', request.url(), request.failure()?.errorText));

  console.log("Navigating to http://0.0.0.0:3000...");
  await page.goto('http://0.0.0.0:3000', { waitUntil: 'networkidle0', timeout: 30000 });
  console.log("Navigation finished.");
  
  await browser.close();
})();
