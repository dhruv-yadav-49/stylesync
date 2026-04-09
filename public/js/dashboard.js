const siteId = window.location.pathname.split('/').pop();
let tokens = null;

// Initial Load
async function init() {
  try {
    const res = await fetch(`/api/tokens/${siteId}`);
    const data = await res.json();
    tokens = data;
    
    // Site Info
    document.getElementById('site-name').innerText = tokens.siteId.site_name || tokens.siteId.url;
    document.getElementById('site-url').innerText = tokens.siteId.url;

    renderSidebar();
    updateTheme();
    fetchHistory();
    
    // Add entrance animation delay to cards
    setTimeout(() => {
      document.querySelectorAll('.card-specimen, .glass-card').forEach((card, i) => {
        card.style.animationDelay = `${i * 0.05}s`;
      });
    }, 100);

  } catch (error) {
    console.error('Failed to load tokens:', error);
  }
}

function updateTheme() {
  const root = document.documentElement;
  const { colors, typography, spacing } = tokens;

  // Colors with Transition
  root.style.setProperty('--ui-primary', colors.primary);
  root.style.setProperty('--ui-secondary', colors.secondary);
  root.style.setProperty('--ui-accent', colors.accent);
  root.style.setProperty('--ui-bg', colors.background);
  root.style.setProperty('--ui-text', colors.text);

  // Typography
  root.style.setProperty('--ui-heading-font', typography.headingFont);
  root.style.setProperty('--ui-body-font', typography.bodyFont);
  root.style.setProperty('--ui-body-size', typography.baseSize || '16px');
  
  // Dynamic Scale
  const scale = typography.scale || [];
  const h1Size = scale.find(s => s.label === 'H1')?.size || '3.5rem';
  const h2Size = scale.find(s => s.label === 'H2')?.size || '2rem';
  const h3Size = scale.find(s => s.label === 'H3')?.size || '1.25rem';
  
  root.style.setProperty('--ui-h1', h1Size);
  root.style.setProperty('--ui-h2', h2Size);
  root.style.setProperty('--ui-h3', h3Size);
  
  // Update Labels in Preview
  const h1Label = document.getElementById('h1-label');
  if (h1Label) h1Label.innerText = `Display H1 • ${h1Size}`;
  
  // Radius & Spacing
  root.style.setProperty('--ui-radius', `${spacing.baseUnit * 2.5 || 10}px`);
}

function renderSidebar() {
  renderColors();
  renderTypography();
  renderSpacing();
}

async function fetchHistory() {
  try {
    const res = await fetch(`/api/tokens/${siteId}/history`);
    if (!res.ok) return;
    const { history } = await res.json();
    renderHistory(history);
  } catch (error) {
    console.error('Failed to fetch history:', error);
  }
}

function renderHistory(history) {
  const container = document.getElementById('version-history');
  if (!history || history.length === 0) {
    container.innerHTML = `<p style="font-size: 0.75rem; opacity: 0.5;">No history available yet.</p>`;
    return;
  }

  container.innerHTML = history.map(v => {
    const date = new Date(v.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `
      <div class="history-item glass-card" onclick="restoreVersion('${encodeURIComponent(JSON.stringify(v.tokens))}')">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span style="font-size: 0.75rem; font-weight: 500;">${v.change_description}</span>
          <span style="font-size: 0.65rem; opacity: 0.5;">${date}</span>
        </div>
      </div>
    `;
  }).join('');
}

function restoreVersion(tokensJson) {
  const restoredColors = JSON.parse(decodeURIComponent(tokensJson));
  tokens.colors = { ...tokens.colors, ...restoredColors };
  updateTheme();
  renderSidebar();
  
  // Satisfying flash effect
  const main = document.querySelector('.main-content');
  main.style.opacity = '0.5';
  setTimeout(() => main.style.opacity = '1', 200);
}

function renderColors() {
  const container = document.getElementById('color-tokens');
  container.innerHTML = '';
  
  Object.entries(tokens.colors).forEach(([key, value]) => {
    if (key === 'neutrals') return;
    const isLocked = tokens.locked.colors.includes(key);
    
    const div = document.createElement('div');
    div.className = `token-row ${isLocked ? 'locked-glow' : ''}`;
    div.innerHTML = `
      <div class="token-info">
        <input type="color" class="color-swatch-input" value="${value}" oninput="handleColorChange('${key}', this.value)" 
               style="width: 24px; height: 24px; border: none; border-radius: 4px; overflow: hidden; cursor: pointer; padding: 0;">
        <span style="font-size: 0.85rem; font-weight: 500; color: #fff;">${key}</span>
      </div>
      <button class="lock-btn ${isLocked ? 'locked' : ''}" onclick="toggleLock('colors', '${key}')">
        <svg fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zM7 7a3 3 0 016 0v2H7V7z"></path></svg>
      </button>
    `;
    container.appendChild(div);
  });
}

function renderTypography() {
  const container = document.getElementById('typography-tokens');
  container.innerHTML = `
    <div class="glass-card" style="padding: 1rem; margin-bottom: 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <label style="font-size: 0.75rem; font-weight: 600; color: var(--app-text-muted);">HEADING FONT</label>
        <button class="lock-btn ${tokens.locked.typography.includes('headingFont') ? 'locked' : ''}" onclick="toggleLock('typography', 'headingFont')">
          <svg fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zM7 7a3 3 0 016 0v2H7V7z"></path></svg>
        </button>
      </div>
      <input type="text" class="glass-card" value="${tokens.typography.headingFont}" onchange="handleTypeChange('headingFont', this.value)" 
             style="width: 100%; padding: 0.5rem; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 0.9rem;">
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.75rem;">
         <select class="glass-card" onchange="handleTypeChange('h1-weight', this.value)" style="padding: 0.4rem; color: #fff; border: 1px solid rgba(255,255,255,0.1); font-size: 0.8rem; background: #111;">
           <option value="400">Regular</option>
           <option value="600" selected>Semi-Bold</option>
           <option value="700">Bold</option>
         </select>
         <input type="text" class="glass-card" value="${tokens.typography.scale?.[0]?.size || '3.5rem'}" onchange="handleTypeChange('h1-size', this.value)"
                style="padding: 0.4rem; color: #fff; border: 1px solid rgba(255,255,255,0.1); font-size: 0.8rem; text-align: center;">
      </div>
    </div>

    <div class="glass-card" style="padding: 1rem;">
       <label style="font-size: 0.75rem; font-weight: 600; color: var(--app-text-muted); display: block; margin-bottom: 0.75rem;">BODY FONT</label>
       <input type="text" class="glass-card" value="${tokens.typography.bodyFont}" onchange="handleTypeChange('bodyFont', this.value)" 
              style="width: 100%; padding: 0.5rem; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 0.9rem;">
    </div>
  `;
}

function renderSpacing() {
  const container = document.getElementById('spacing-tokens');
  const bars = document.getElementById('spacing-bars');
  
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
      <span style="font-size: 0.8rem; color: #fff;">Base: ${tokens.spacing.baseUnit}px</span>
      <input type="range" min="2" max="16" value="${tokens.spacing.baseUnit}" 
             oninput="handleSpacingChange('baseUnit', this.value)" style="flex: 0.6; height: 4px; border-radius: 2px; cursor: pointer;">
    </div>
  `;

  // Render Visual Scale
  bars.innerHTML = '';
  const scale = tokens.spacing.scale || [4, 8, 16, 24, 32, 48, 64];
  scale.forEach((val, i) => {
    const bar = document.createElement('div');
    bar.className = 'spacing-bar';
    bar.style.height = `${(val / scale[scale.length-1]) * 100}%`;
    bar.title = `${val}px`;
    bar.onclick = () => console.log(`Spacing Token ${i}: ${val}px`);
    bars.appendChild(bar);
  });
}

function handleColorChange(key, value) {
  tokens.colors[key] = value;
  updateTheme();
}

function handleTypeChange(key, value) {
  if (key === 'h1-size') {
    if (!tokens.typography.scale) tokens.typography.scale = [];
    let h1 = tokens.typography.scale.find(s => s.label === 'H1');
    if (h1) h1.size = value;
    else tokens.typography.scale.push({ label: 'H1', size: value, weight: '700' });
  } else {
    tokens.typography[key] = value;
  }
  updateTheme();
}

function handleSpacingChange(key, value) {
  tokens.spacing[key] = parseInt(value);
  const unit = tokens.spacing.baseUnit;
  tokens.spacing.scale = [unit, unit*2, unit*4, unit*6, unit*8, unit*12];
  renderSpacing();
  updateTheme();
}

async function toggleLock(category, field) {
  const isLocked = !tokens.locked[category].includes(field);
  
  try {
    const res = await fetch(`/api/tokens/${siteId}/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, field, isLocked })
    });
    
    if (res.ok) {
      const { locked } = await res.json();
      tokens.locked = locked;
      renderSidebar();
    }
  } catch (error) {
    console.error('Lock error:', error);
  }
}

document.getElementById('save-btn').addEventListener('click', async () => {
  const btn = document.getElementById('save-btn');
  const originalText = btn.innerText;
  btn.innerText = 'Syncing...';
  
  try {
    const res = await fetch(`/api/tokens/${siteId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        colors: tokens.colors,
        typography: tokens.typography,
        spacing: tokens.spacing
      })
    });
    
    if (res.ok) {
      btn.innerText = 'Synchronized!';
      btn.style.background = '#10b981';
      btn.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
      fetchHistory(); // Refresh history
      setTimeout(() => {
        btn.innerText = originalText;
        btn.style.background = '';
        btn.style.boxShadow = '';
      }, 2000);
    }
  } catch (error) {
    btn.innerText = 'Error';
    setTimeout(() => { btn.innerText = originalText; }, 2000);
  }
});

function exportTokens(format) {
  let content = '';
  let filename = `style-guide.${format === 'tailwind' ? 'js' : format}`;
  
  if (format === 'json') {
    content = JSON.stringify(tokens, null, 2);
  } else if (format === 'css') {
    content = `:root {\n`;
    Object.entries(tokens.colors).forEach(([k, v]) => content += `  --color-${k}: ${v};\n`);
    content += `  --font-heading: "${tokens.typography.headingFont}";\n`;
    content += `  --font-body: "${tokens.typography.bodyFont}";\n`;
    content += `  --base-spacing: ${tokens.spacing.baseUnit}px;\n`;
    content += '}';
  } else if (format === 'tailwind') {
    content = `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n`;
    Object.entries(tokens.colors).forEach(([k, v]) => content += `        '${k}': '${v}',\n`);
    content += `      },\n      fontFamily: {\n        heading: ['${tokens.typography.headingFont}'],\n        body: ['${tokens.typography.bodyFont}']\n      }\n    }\n  }\n}`;
  }

  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

init();
