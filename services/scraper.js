const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

class ScraperService {
  async scrape(targetUrl) {
    let browser;
    try {
      const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;
      
      let localPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      const commonPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Local\\Google\\Chrome\\Application\\chrome.exe'
      ];

      if (!isProd) {
        const fs = require('fs');
        for (const path of commonPaths) {
          if (fs.existsSync(path)) {
            localPath = path;
            break;
          }
        }
      }

      browser = await puppeteer.launch({
        args: isProd ? chromium.args : [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ],
        executablePath: isProd 
          ? await chromium.executablePath() 
          : localPath,
        headless: isProd ? chromium.headless : 'new',
        defaultViewport: chromium.defaultViewport,
      });
      const page = await browser.newPage();
      
      // Set viewport for consistent extraction
      await page.setViewport({ width: 1280, height: 800 });
      
      // Navigate and wait for content (faster than networkidle2)
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Brief scroll to trigger lazy loading
      await page.evaluate(async () => {
        window.scrollBy(0, window.innerHeight);
        await new Promise(r => setTimeout(r, 500));
      });

      // Extract Computed Styles and Image Assets
      const result = await page.evaluate(() => {
        const getStyles = (el) => {
          const style = window.getComputedStyle(el);
          return {
            color: style.color,
            backgroundColor: style.backgroundColor,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            padding: style.padding,
            margin: style.margin
          };
        };

        // Extract from common elements
        const elements = document.querySelectorAll('h1, h2, h3, p, a, button, nav, footer, header');
        const computedStyles = Array.from(elements).map(el => ({
          tag: el.tagName.toLowerCase(),
          styles: getStyles(el)
        }));

        // Extract Images for analysis
        const images = Array.from(document.querySelectorAll('img, [style*="background-image"]')).map(el => {
          if (el.tagName === 'IMG') return el.src;
          const bg = el.style.backgroundImage;
          return bg ? bg.slice(4, -1).replace(/"/g, "") : null;
        }).filter(url => url && url.startsWith('http'));

        // Extract Meta Info
        const siteName = document.querySelector('meta[property="og:site_name"]')?.content || document.title;

        return {
          siteName,
          computedStyles,
          images: [...new Set(images)],
          html: document.documentElement.outerHTML
        };
      });

      return result;
    } catch (error) {
      console.error('Puppeteer scraping error:', error);
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  }
}

module.exports = new ScraperService();
