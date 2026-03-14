/**
 * Publish Gate v0.5 - Side Panel Application
 * Phase 0.5 MVP: URL pre-fill, analysis trigger, 4-step loading, results display.
 *
 * === Extension Responsibility Boundary ===
 * Extension handles:
 *   - Quick analysis of current tab (one-click)
 *   - Recent analysis history (last 5)
 *   - Navigation to Web dashboard for deep features
 * Web dashboard handles:
 *   - Detailed analysis views
 *   - Comparison / competitive analysis
 *   - Share URL management
 *   - Business/Pro tier features
 *   - Team collaboration
 *
 * API response structure (from web dashboard):
 * {
 *   id, url, status, result?: {
 *     company_understanding: { summary, industry, business_model, ... },
 *     page_reading: { page_type, fv_main_copy, cta_map, confidence, ... },
 *     improvement_potential: "+XX%",
 *     issues: [{ priority, title, diagnosis, impact, handoff_to, brief, evidence }],
 *     regulatory?: { yakujiho_risks, keihinhyoujiho_risks },
 *     metadata: { analyzed_at, analysis_duration_ms, vision_used, dom_extracted }
 *   }
 * }
 */

// --- Configuration (uses API_BASE from constants.js loaded in sidepanel.html) ---
// Fallback if constants.js not loaded
if (typeof API_BASE === 'undefined') {
  var API_BASE = 'http://localhost:3000';
}
const DASHBOARD_URL = API_BASE;
const MAX_RECENT = 5;

// --- State ---
const state = {
  currentUrl: '',
  currentTabId: null,
  analysisData: null,
  isAnalyzing: false,
  abortController: null,
};

// --- Recent Analyses (in-memory, persists during extension session) ---
let recentAnalyses = [];

try {
  const stored = localStorage.getItem('pg_recent');
  if (stored) recentAnalyses = JSON.parse(stored);
} catch (_) { /* ignore */ }

function saveRecent(url, analysisId, topIssue) {
  recentAnalyses = recentAnalyses.filter(function (r) { return r.url !== url; });
  recentAnalyses.unshift({
    url: url,
    analysisId: analysisId,
    topIssue: topIssue || '',
    analyzedAt: new Date().toISOString(),
  });
  if (recentAnalyses.length > MAX_RECENT) recentAnalyses = recentAnalyses.slice(0, MAX_RECENT);
  try { localStorage.setItem('pg_recent', JSON.stringify(recentAnalyses)); } catch (_) { /* ignore */ }
}

function renderRecent() {
  var section = document.getElementById('recentSection');
  var list = document.getElementById('recentList');
  if (!section || !list) return;
  if (recentAnalyses.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';
  var html = '';
  recentAnalyses.slice(0, 3).forEach(function (item) {
    var displayUrl = item.url.replace(/^https?:\/\//, '').substring(0, 40);
    var dashUrl = DASHBOARD_URL + '/analysis/' + escAttr(item.analysisId);
    html += '<a class="recent-item" href="' + dashUrl + '" target="_blank">';
    html += '<span class="recent-url">' + escHtml(displayUrl) + '</span>';
    if (item.topIssue) {
      html += '<span class="recent-issue">' + escHtml(item.topIssue) + '</span>';
    }
    html += '</a>';
  });
  list.innerHTML = html;
}

// --- Messaging ---
function sendMessage(msg) {
  return new Promise(function (resolve) { chrome.runtime.sendMessage(msg, resolve); });
}

// --- Init ---
document.addEventListener('DOMContentLoaded', async function () {
  await loadCurrentTab();
  bindEvents();
  setupDashboardLinks();
  renderRecent();
});

async function loadCurrentTab() {
  var tab = await sendMessage({ type: 'GET_CURRENT_TAB' });
  if (tab && !tab.error) {
    state.currentUrl = tab.url;
    state.currentTabId = tab.tabId;
    document.getElementById('urlInput').value = tab.url || '';
  }
}

function setupDashboardLinks() {
  var promoLink = document.getElementById('dashboardPromoLink');
  if (promoLink) promoLink.href = DASHBOARD_URL + '/?ref=extension';
  var poweredByLink = document.getElementById('poweredByLink');
  if (poweredByLink) poweredByLink.href = DASHBOARD_URL + '/?ref=extension_powered_by';
}

function bindEvents() {
  document.getElementById('analyzeBtn').addEventListener('click', startAnalysis);
  document.getElementById('cancelBtn').addEventListener('click', cancelAnalysis);
  document.getElementById('retryBtn').addEventListener('click', function () {
    showScreen('input');
    loadCurrentTab();
  });
}

// --- Screen Navigation ---
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
  var el = document.getElementById('screen-' + name);
  if (el) el.classList.add('active');
}

// --- Analysis Flow ---
async function startAnalysis() {
  if (state.isAnalyzing) return;

  var url = state.currentUrl;
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    showError('有効なURLのページを開いてください');
    return;
  }

  state.isAnalyzing = true;
  showScreen('loading');
  resetLoadingSteps();

  // Step 1: Screenshot
  setLoadingStep(1, 'active');
  updateProgress(10);

  // Small delay to show step 1 visually
  await delay(300);
  setLoadingStep(1, 'done');

  // Step 2: DOM extraction
  setLoadingStep(2, 'active');
  updateProgress(30);
  await delay(300);
  setLoadingStep(2, 'done');

  // Step 3: AI analysis (actual API call)
  setLoadingStep(3, 'active');
  updateProgress(50);

  try {
    var result = await sendMessage({
      type: 'START_ANALYSIS',
      url: url,
    });

    if (!result || result.error) {
      state.isAnalyzing = false;
      var msg = result?.message || 'Analysis failed';
      showError(msg);
      return;
    }

    // Step 3 done
    setLoadingStep(3, 'done');
    updateProgress(85);

    // Step 4: Rendering results
    setLoadingStep(4, 'active');
    await delay(400);
    setLoadingStep(4, 'done');
    updateProgress(100);

    await delay(300);

    state.analysisData = result.data;
    state.isAnalyzing = false;

    // Save to recent
    var analysisResult = result.data.result || result.data;
    var topIssue = analysisResult.issues && analysisResult.issues[0] ? analysisResult.issues[0].title : '';
    saveRecent(url, result.data.id || '', topIssue);

    renderResults(result.data, url);
    showScreen('results');
  } catch (err) {
    state.isAnalyzing = false;
    showError(err.message || 'Unknown error occurred');
  }
}

function cancelAnalysis() {
  state.isAnalyzing = false;
  showScreen('input');
}

// --- Loading Step Management ---
function resetLoadingSteps() {
  document.querySelectorAll('.loading-step').forEach(function (step) {
    step.classList.remove('active', 'done');
    step.querySelector('.step-icon').textContent = '\u25CB'; // empty circle
  });
  updateProgress(0);
}

function setLoadingStep(stepNum, status) {
  var step = document.querySelector('.loading-step[data-step="' + stepNum + '"]');
  if (!step) return;
  var icon = step.querySelector('.step-icon');

  step.classList.remove('active', 'done');
  if (status === 'active') {
    step.classList.add('active');
    icon.textContent = '\u25D4'; // spinning indicator (half circle)
  } else if (status === 'done') {
    step.classList.add('done');
    icon.textContent = '\u2713'; // check mark
  }
}

function updateProgress(percent) {
  document.getElementById('progressBar').style.width = percent + '%';
}

// --- Error Display ---
function showError(message) {
  document.getElementById('errorMessage').textContent = message;
  showScreen('error');
}

// --- Results Rendering ---
function renderResults(data, url) {
  var container = document.getElementById('resultsContent');

  // Handle both direct result objects and wrapped AnalyzeResponse
  var result = data.result || data;
  var analysisId = data.id || '';

  var html = '';

  // URL header
  html += '<div class="results-header">';
  html += '<p class="results-url">' + escHtml(url) + '</p>';
  html += '</div>';

  // Improvement Potential
  if (result.improvement_potential) {
    html += '<div class="improvement-potential">';
    html += '<div class="improvement-label">改善ポテンシャル</div>';
    html += '<div class="improvement-value">' + escHtml(result.improvement_potential) + '</div>';
    html += '</div>';
  }

  // Company Understanding (summary only in extension)
  if (result.company_understanding) {
    var cu = result.company_understanding;
    html += '<div class="section-title">企業理解</div>';
    html += '<div class="company-card">';
    html += '<div class="company-card-value">' + escHtml(cu.summary) + '</div>';
    if (cu.industry || cu.business_model) {
      html += '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">';
      if (cu.industry) {
        html += '<span class="badge badge-medium">' + escHtml(cu.industry) + '</span>';
      }
      if (cu.business_model) {
        html += '<span class="badge badge-medium">' + escHtml(cu.business_model) + '</span>';
      }
      html += '</div>';
    }
    html += '</div>';
  }

  // Issues (top 3 only in extension, with note for more)
  if (result.issues && result.issues.length > 0) {
    var sortedIssues = result.issues.slice().sort(function (a, b) { return a.priority - b.priority; });
    var displayIssues = sortedIssues.slice(0, 3);
    var remainingCount = sortedIssues.length - 3;

    html += '<div class="section-title">改善課題（上位' + displayIssues.length + '件）</div>';
    displayIssues.forEach(function (issue) {
      html += renderIssueCard(issue);
    });

    if (remainingCount > 0 && analysisId) {
      html += '<div class="more-issues-hint">';
      html += '他 ' + remainingCount + ' 件の課題はWebダッシュボードで確認';
      html += '</div>';
    }
  }

  // Primary CTA: Go to Web Dashboard for full details
  if (analysisId) {
    html += '<a class="btn btn-primary w-full dashboard-cta" href="' + DASHBOARD_URL + '/analysis/' + escAttr(analysisId) + '?ref=extension" target="_blank">';
    html += 'Webで詳細を見る・共有する';
    html += '</a>';
  }

  // Secondary: New analysis
  html += '<button class="btn btn-outline w-full new-analysis-btn" id="newAnalysisBtn">';
  html += '新しいページを分析';
  html += '</button>';

  container.innerHTML = html;

  // Bind new analysis button
  document.getElementById('newAnalysisBtn')?.addEventListener('click', function () {
    showScreen('input');
    loadCurrentTab();
    renderRecent();
  });
}

function renderIssueCard(issue) {
  var html = '<div class="issue-card">';
  html += '<div class="issue-card-header">';
  html += '<span class="issue-priority">' + issue.priority + '</span>';
  html += '<span class="issue-title">' + escHtml(issue.title) + '</span>';
  html += '</div>';

  if (issue.diagnosis) {
    html += '<div class="issue-diagnosis">' + escHtml(issue.diagnosis) + '</div>';
  }

  // Badges (simplified for extension)
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">';
  if (issue.impact) {
    html += '<span class="badge badge-' + issue.impact + '">';
    html += 'インパクト: ' + (issue.impact === 'high' ? '高' : issue.impact === 'medium' ? '中' : '低');
    html += '</span>';
  }
  if (issue.handoff_to) {
    html += '<span class="issue-handoff">' + escHtml(issue.handoff_to) + '</span>';
  }
  html += '</div>';

  html += '</div>';
  return html;
}

function renderRegulatoryRisk(risk, category) {
  var levelColors = {
    high: 'danger',
    medium: 'warning',
    low: 'success',
  };
  var levelLabels = {
    high: '高リスク',
    medium: '中リスク',
    low: '低リスク',
  };
  var colorKey = levelColors[risk.risk_level] || 'warning';
  var html = '<div class="issue-card" style="border-left:3px solid var(--' + colorKey + ')">';
  html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">';
  html += '<span class="badge badge-' + risk.risk_level + '">' + escHtml(category) + ' - ' + (levelLabels[risk.risk_level] || risk.risk_level) + '</span>';
  html += '</div>';
  html += '<div style="font-size:13px;font-weight:500;margin-bottom:4px">' + escHtml(risk.expression) + '</div>';
  html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px">' + escHtml(risk.reason) + '</div>';
  if (risk.recommendation) {
    html += '<div style="font-size:12px;color:var(--primary);font-weight:500">推奨: ' + escHtml(risk.recommendation) + '</div>';
  }
  html += '</div>';
  return html;
}

// --- Helpers ---
function escHtml(str) {
  var div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function escAttr(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function delay(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}
