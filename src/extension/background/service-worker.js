/**
 * Publish Gate v0.5 - Service Worker
 * Orchestrates: screenshot capture -> DOM extraction -> API call -> results
 * Message passing between content script and side panel.
 *
 * Phase 0.5 MVP: Tab 1 (LP Analysis) only.
 */

// --- Configuration (imported from constants.js via importScripts) ---
try {
  importScripts('../constants.js');
} catch (e) {
  console.warn('Failed to import constants.js, using defaults:', e);
}
// API_BASE and ENDPOINTS are defined in constants.js
// Fallback if import failed
if (typeof ENDPOINTS === 'undefined') {
  var API_BASE = 'http://localhost:3000';
  var ENDPOINTS = { ANALYZE: API_BASE + '/api/analyze' };
}

// --- Side Panel activation on action click ---
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch(e => console.error('sidePanel behavior error:', e));

// --- Message handler ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg, sender)
    .then(sendResponse)
    .catch(err => {
      console.error('Message handler error:', err);
      sendResponse({ error: true, message: err.message || 'Unknown error' });
    });
  return true; // Keep channel open for async response
});

async function handleMessage(msg, sender) {
  switch (msg.type) {
    case 'GET_CURRENT_TAB':
      return handleGetCurrentTab();
    case 'START_ANALYSIS':
      return handleStartAnalysis(msg);
    case 'CAPTURE_SCREENSHOT':
      return handleCaptureScreenshot();
    default:
      return { error: true, message: 'Unknown message type: ' + msg.type };
  }
}

// --- Get current tab URL ---
async function handleGetCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return { error: true, message: 'No active tab found' };
  return {
    url: tab.url || '',
    title: tab.title || '',
    tabId: tab.id,
  };
}

// --- Capture screenshot of visible tab ---
async function handleCaptureScreenshot() {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'jpeg',
      quality: 80,
    });
    return { success: true, screenshot: dataUrl };
  } catch (e) {
    console.error('Screenshot capture failed:', e);
    return { error: true, message: 'Screenshot capture failed: ' + e.message };
  }
}

// --- Event tracking (fire-and-forget) ---
function trackExtensionEvent(type, data = {}) {
  const trackUrl = (typeof API_BASE !== 'undefined' ? API_BASE : 'http://localhost:3000') + '/api/track';
  fetch(trackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data }),
  }).catch(() => { /* silently ignore */ });
}

// --- Main analysis flow ---
// Step 1: Capture screenshot
// Step 2: Inject content script and extract DOM features
// Step 3: Send to API (screenshot + DOM features)
// Step 4: Return results
async function handleStartAnalysis(msg) {
  const url = msg.url;
  if (!url) return { error: true, message: 'URL is required' };

  // Track extension analysis start
  trackExtensionEvent('extension_analysis_started', { url });

  // Get the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { error: true, message: 'No active tab found' };

  // Verify the tab URL matches the requested URL (basic check)
  if (tab.url !== url) {
    return { error: true, message: 'Active tab URL does not match. Please navigate to the target page first.' };
  }

  // --- Step 1: Capture screenshot ---
  let screenshotDataUrl = null;
  try {
    screenshotDataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'jpeg',
      quality: 80,
    });
  } catch (e) {
    console.warn('Screenshot capture failed, continuing without it:', e.message);
    // Continue without screenshot - DOM analysis alone is still valuable
  }

  // --- Step 2: Inject content script and extract DOM ---
  let pageFeatures = null;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content/content-script.js'],
    });

    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.__publishGate?.extractFeatures?.(),
    });

    pageFeatures = result?.result;
  } catch (e) {
    return {
      error: true,
      message: 'This page cannot be analyzed: ' + e.message,
      step: 2,
    };
  }

  if (!pageFeatures || pageFeatures.error) {
    return {
      error: true,
      message: 'Failed to extract page features: ' + (pageFeatures?.error || 'unknown'),
      step: 2,
    };
  }

  // --- Step 3: Send to API ---
  let analysisResult;
  try {
    const requestBody = {
      url: url,
      page_features: pageFeatures,
    };

    // Include screenshot as base64 if available
    if (screenshotDataUrl) {
      requestBody.screenshot = screenshotDataUrl;
    }

    const response = await fetch(ENDPOINTS.ANALYZE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'chrome-extension',
        'X-Extension-Version': '0.5.0',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return {
        error: true,
        message: errBody.error?.message || 'API error (HTTP ' + response.status + ')',
        step: 3,
      };
    }

    analysisResult = await response.json();
  } catch (e) {
    return {
      error: true,
      message: 'API connection failed: ' + e.message,
      step: 3,
    };
  }

  // --- Step 4: Return results ---
  return {
    success: true,
    data: analysisResult,
    url: url,
    tabId: tab.id,
    hasScreenshot: !!screenshotDataUrl,
  };
}
