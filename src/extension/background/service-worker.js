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

// --- Main analysis flow ---
// The extension delegates all analysis to the Dashboard API.
// It sends { url, ref: "extension" } conforming to AnalyzeRequest (types.ts).
// The Dashboard API performs server-side fetch, DOM extraction, screenshot,
// and Claude API call. The extension only needs to display results.
//
// Contract: POST /api/analyze
//   Request:  { url: string, ref: "extension" }
//   Response: AnalyzeResponse { id, url, status, result?, error?, created_at }
async function handleStartAnalysis(msg) {
  const url = msg.url;
  if (!url) return { error: true, message: 'URL is required' };

  // Basic URL validation before sending to API
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { error: true, message: '有効なURLのページを開いてください' };
  }

  // --- Send to Dashboard API ---
  // The API handles all analysis steps server-side:
  // Step 1: Company research (server-side HTML fetch)
  // Step 2: Page reading (server-side DOM extraction + screenshot)
  // Step 3: Diagnosis (Claude API)
  // Step 4: Brief generation (Claude API)
  let analysisResult;
  try {
    const response = await fetch(ENDPOINTS.ANALYZE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        ref: 'extension',
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      // Dashboard API returns { error: string } for all error responses
      const errorMsg = errBody.error || 'API error (HTTP ' + response.status + ')';

      // Provide user-friendly messages for known status codes
      if (response.status === 429) {
        return { error: true, message: errorMsg };
      }
      if (response.status === 400) {
        return { error: true, message: errorMsg };
      }
      return { error: true, message: errorMsg };
    }

    analysisResult = await response.json();
  } catch (e) {
    return {
      error: true,
      message: 'API接続に失敗しました: ' + e.message,
    };
  }

  // Validate response conforms to AnalyzeResponse contract
  if (analysisResult.status === 'error') {
    return {
      error: true,
      message: analysisResult.error || '分析中にエラーが発生しました',
    };
  }

  // --- Return results ---
  return {
    success: true,
    data: analysisResult,
    url: url,
  };
}
