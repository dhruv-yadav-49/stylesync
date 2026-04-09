document.getElementById('scrape-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const urlInput = e.target.url;
  const url = urlInput.value;
  const loader = document.getElementById('loader');
  const skeleton = document.getElementById('skeleton');
  const errorMsg = document.getElementById('error-msg');
  const form = document.querySelector('.search-container');
  const statusLine = document.getElementById('parsing-status');

  // Hide form, show parsing overlay
  form.style.opacity = '0';
  form.style.transform = 'scale(0.95)';
  form.style.pointerEvents = 'none';
  loader.classList.add('active');
  errorMsg.style.display = 'none';

  // Realistic parsing steps
  const steps = [
    "Initializing Headless Browser...",
    "Bypassing Anti-Bot Protections...",
    "Injecting Analysis Scripts...",
    "Extracting Computed Styles...",
    "Analyzing Color Harmonies...",
    "Mapping Typography Scales...",
    "Finalizing Design Tokens..."
  ];
  let stepIdx = 0;
  const stepInterval = setInterval(() => {
    if (stepIdx < steps.length) {
      statusLine.innerText = steps[stepIdx++];
    }
  }, 1200);

  try {
    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (response.ok) {
      clearInterval(stepInterval);
      statusLine.innerText = "Guide Ready! Redirecting...";
      
      setTimeout(() => {
        loader.classList.remove('active');
        skeleton.style.display = 'flex';
        skeleton.style.opacity = '1';
        
        setTimeout(() => {
          window.location.href = `/dashboard/${data.site._id}`;
        }, 1000);
      }, 500);
    } else {
      throw new Error(data.error || 'Scraping failed');
    }
  } catch (error) {
    clearInterval(stepInterval);
    console.error('Error:', error);
    errorMsg.innerText = error.message.includes('blocks scanners') 
      ? 'This site has advanced bot protection. Try another URL or check back later.' 
      : error.message;
    errorMsg.style.display = 'block';
    
    // Reset UI
    form.style.opacity = '1';
    form.style.transform = 'scale(1)';
    form.style.pointerEvents = 'auto';
    loader.classList.remove('active');
    skeleton.style.display = 'none';
  }
});
