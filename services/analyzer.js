const _ = require('lodash');
const imageProcessor = require('./imageProcessor');

class AnalyzerService {
  async analyze(scrapedData) {
    const { computedStyles, images } = scrapedData;

    // 1. Image Branding Analysis
    const imageColors = await imageProcessor.getDominantColors(images);

    // 2. Computed Style Analysis
    const colorAnalysis = this.analyzeColors(computedStyles, imageColors);
    const typographyAnalysis = this.analyzeTypography(computedStyles);
    const spacingAnalysis = this.analyzeSpacing(computedStyles);

    return {
      colors: colorAnalysis,
      typography: typographyAnalysis,
      spacing: spacingAnalysis
    };
  }

  analyzeColors(styles, imageColors) {
    const allBackgrounds = styles.map(s => s.styles.backgroundColor).filter(c => c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent');
    const allTextColors = styles.map(s => s.styles.color).filter(c => !!c);

    const freqBackgrounds = _.take(_.orderBy(_.toPairs(_.countBy(allBackgrounds)), [1], ['desc']), 10).map(p => this.rgbToHex(p[0]));
    const freqText = _.take(_.orderBy(_.toPairs(_.countBy(allTextColors)), [1], ['desc']), 10).map(p => this.rgbToHex(p[0]));

    // Consolidate with priority
    const primary = imageColors[0] || freqBackgrounds.find(c => c !== '#ffffff') || '#3b82f6';
    const secondary = imageColors[1] || freqBackgrounds.find(c => c !== '#ffffff' && c !== primary) || '#1f2937';
    
    return {
      primary,
      secondary,
      accent: imageColors[2] || '#10b981',
      background: freqBackgrounds.find(c => c === '#ffffff' || c.startsWith('#f')) || '#ffffff',
      text: freqText[0] || '#1a1a1a',
      neutrals: _.uniq([...freqBackgrounds, ...freqText]).slice(0, 5)
    };
  }

  analyzeTypography(styles) {
    const fonts = styles.map(s => s.styles.fontFamily.split(',')[0].replace(/"/g, '').trim());
    const sizes = styles.map(s => s.styles.fontSize);
    
    // Weight by tag prominence
    const h1Styles = styles.find(s => s.tag === 'h1')?.styles;

    return {
      families: _.take(_.orderBy(_.toPairs(_.countBy(fonts)), [1], ['desc']), 5).map(p => p[0]),
      sizes: _.take(_.orderBy(_.toPairs(_.countBy(sizes)), [1], ['desc']), 10).map(p => p[0]),
      headingFont: h1Styles?.fontFamily.split(',')[0].replace(/"/g, '') || fonts[0] || 'Inter',
      bodyFont: styles.find(s => s.tag === 'p')?.styles.fontFamily.split(',')[0].replace(/"/g, '') || fonts[1] || fonts[0] || 'Inter',
      baseSize: styles.find(s => s.tag === 'p')?.styles.fontSize || '16px'
    };
  }

  analyzeSpacing(styles) {
    const paddings = styles.map(s => parseInt(s.styles.padding) || 0).filter(n => n > 0);
    const margins = styles.map(s => parseInt(s.styles.margin) || 0).filter(n => n > 0);
    
    const allSpacing = [...paddings, ...margins];
    const freq = _.take(_.orderBy(_.toPairs(_.countBy(allSpacing)), [1], ['desc']), 5).map(p => parseInt(p[0]));
    
    return {
      baseUnit: freq[0] || 8,
      scale: _.uniq(freq).sort((a,b) => a-b)
    };
  }

  rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb.toLowerCase();
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return rgb;
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
}

module.exports = new AnalyzerService();
