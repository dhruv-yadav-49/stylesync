const puppeteer = require('puppeteer');

class ScraperService {
  async scrape(targetUrl) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
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
