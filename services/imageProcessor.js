const Vibrant = require('node-vibrant');
const axios = require('axios');
const sharp = require('sharp');

class ImageProcessor {
  async extractPalette(imageUrl) {
    try {
      // Skip SVGs as node-vibrant only supports bitmap images
      if (imageUrl.toLowerCase().endsWith('.svg')) return null;

      // Fetch image data
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 5000 });
      if (!response.data || response.data.length === 0) return null;
      const buffer = Buffer.from(response.data);

      // Process with Vibrant
      try {
        const palette = await Vibrant.from(buffer).getPalette();
        return {
          vibrant: palette.Vibrant?.getHex(),
          darkVibrant: palette.DarkVibrant?.getHex(),
          lightVibrant: palette.LightVibrant?.getHex(),
          muted: palette.Muted?.getHex(),
          darkMuted: palette.DarkMuted?.getHex()
        };
      } catch (innerError) {
        // Silently skip if MIME type is unsupported
        return null;
      }
    } catch (error) {
      console.error(`Image processing error for ${imageUrl}:`, error.message);
      return null;
    }
  }

  async getDominantColors(imageUrls) {
    if (!imageUrls || imageUrls.length === 0) return [];
    
    // Analyze top 5 images in parallel
    const limit = Math.min(imageUrls.length, 5);
    const topImages = imageUrls.slice(0, limit);

    try {
      const palettes = await Promise.all(
        topImages.map(url => this.extractPalette(url).catch(() => null))
      );
      
      const results = palettes.filter(p => p !== null);
      if (results.length === 0) return [];

      // Combine all hex colors from all palettes
      const allHexes = results.flatMap(p => Object.values(p).filter(v => !!v));
      
      // Return unique colors (up to 5)
      return [...new Set(allHexes)].slice(0, 5);
    } catch (error) {
      console.error('getDominantColors total error:', error);
      return [];
    }
  }
}

module.exports = new ImageProcessor();
