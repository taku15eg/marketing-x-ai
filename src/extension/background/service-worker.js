/**
 * Publish Gate v0.5 - Service Worker
 * Orchestrates: URL送信 → API（4ステップ分析パイプライン） → 結果表示
 * Message passing between side panel and API.
 *
 * 設計思想: 「URLを入れるだけで全部出る」
 * 分析パイプライン（企業調査→ページ読取→診断→提案）はサーバーサイドで完結。
 * Chrome拡張はリテンション用の薄いクライアント。
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

// --- Main analysis flow ---
// 拡張はURLのみをAPIに送信。4ステップ分析はサーバーサイドで完結。
// Step 1: 企業調査 (Company Research)
// Step 2: ページ読取 (Page Reading — DOM + Screenshot)
// Step 3: 課題診断 (Diagnosis)
// Step 4: 提案作成 (Brief Generation)
async function handleStartAnalysis(msg) {
  const url = msg.url;
  if (!url) return { error: true, message: 'URL is required' };

  // Validate the tab URL matches
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { error: true, message: 'No active tab found' };

  if (tab.url !== url) {
    return { error: true, message: 'Active tab URL does not match. Please navigate to the target page first.' };
  }

  // Send URL to API — server handles all 4 analysis steps
  let analysisResult;
  try {
    const response = await fetch(ENDPOINTS.ANALYZE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'chrome-extension',
        'X-Extension-Version': VERSION || '0.5.0',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return {
        error: true,
        message: errBody.error?.message || errBody.error || 'API error (HTTP ' + response.status + ')',
      };
    }

    analysisResult = await response.json();
  } catch (e) {
    return {
      error: true,
      message: 'API connection failed: ' + e.message,
    };
  }

  return {
    success: true,
    data: analysisResult,
    url: url,
    tabId: tab.id,
  };
}
