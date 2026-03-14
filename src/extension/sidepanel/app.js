/**
 * Publish Gate v0.5 - Side Panel Application
 * Phase 0.5 MVP: URL pre-fill, analysis trigger, 4-step loading, results display.
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

// --- State ---
const state = {
  currentUrl: '',
  currentTabId: null,
  analysisData: null,
  isAnalyzing: false,
  abortController: null,
};

// --- Messaging ---
function sendMessage(msg) {
  return new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve));
}

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentTab();
  bindEvents();
});

async function loadCurrentTab() {
  const tab = await sendMessage({ type: 'GET_CURRENT_TAB' });
  if (tab && !tab.error) {
    state.currentUrl = tab.url;
    state.currentTabId = tab.tabId;
    document.getElementById('urlInput').value = tab.url || '';
  }
}

function bindEvents() {
  document.getElementById('analyzeBtn').addEventListener('click', startAnalysis);
  document.getElementById('cancelBtn').addEventListener('click', cancelAnalysis);
  document.getElementById('retryBtn').addEventListener('click', () => {
    showScreen('input');
    loadCurrentTab();
  });
}

// --- Screen Navigation ---
function showScreen(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) el.classList.add('active');
}

// --- Analysis Flow ---
async function startAnalysis() {
  if (state.isAnalyzing) return;

  const url = state.currentUrl;
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
    const result = await sendMessage({
      type: 'START_ANALYSIS',
      url: url,
    });

    if (!result || result.error) {
      state.isAnalyzing = false;
      const msg = result?.message || 'Analysis failed';
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
  document.querySelectorAll('.loading-step').forEach((step) => {
    step.classList.remove('active', 'done');
    step.querySelector('.step-icon').textContent = '\u25CB'; // empty circle
  });
  updateProgress(0);
}

function setLoadingStep(stepNum, status) {
  const step = document.querySelector('.loading-step[data-step="' + stepNum + '"]');
  if (!step) return;
  const icon = step.querySelector('.step-icon');

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
  const container = document.getElementById('resultsContent');

  // Handle both direct result objects and wrapped AnalyzeResponse
  const result = data.result || data;
  const analysisId = data.id || '';

  let html = '';

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

  // Company Understanding
  if (result.company_understanding) {
    const cu = result.company_understanding;
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

  // Page Reading
  if (result.page_reading) {
    const pr = result.page_reading;
    html += '<div class="section-title">ページ読取</div>';
    html += '<div class="company-card">';
    html += '<div class="company-card-title">ページタイプ</div>';
    html += '<div class="company-card-value">' + escHtml(pr.page_type) + '</div>';
    if (pr.fv_main_copy) {
      html += '<div class="company-card-title" style="margin-top:8px">メインコピー</div>';
      html += '<div class="company-card-value" style="font-size:13px">' + escHtml(pr.fv_main_copy) + '</div>';
    }
    if (pr.confidence) {
      html += '<div style="margin-top:8px">';
      html += '<span class="badge badge-' + pr.confidence + '">';
      html += '信頼度: ' + (pr.confidence === 'high' ? '高' : pr.confidence === 'medium' ? '中' : '低');
      html += '</span></div>';
    }
    html += '</div>';
  }

  // Regulatory Warnings
  if (result.regulatory) {
    const reg = result.regulatory;
    const yakujiho = reg.yakujiho_risks || [];
    const keihin = reg.keihinhyoujiho_risks || [];
    if (yakujiho.length > 0 || keihin.length > 0) {
      html += '<div class="section-title">法規制リスク</div>';
      yakujiho.forEach(function (risk) {
        html += renderRegulatoryRisk(risk, '薬機法');
      });
      keihin.forEach(function (risk) {
        html += renderRegulatoryRisk(risk, '景表法');
      });
    }
  }

  // Issues
  if (result.issues && result.issues.length > 0) {
    html += '<div class="section-title">改善課題 (' + result.issues.length + '件)</div>';
    var sortedIssues = result.issues.slice().sort(function (a, b) { return a.priority - b.priority; });
    sortedIssues.forEach(function (issue) {
      html += renderIssueCard(issue);
    });
  }

  // Metadata
  if (result.metadata) {
    const meta = result.metadata;
    html += '<div style="margin-top:20px;padding-top:12px;border-top:1px solid var(--border);font-size:11px;color:var(--text-secondary)">';
    if (meta.analyzed_at) {
      html += '<div>分析日時: ' + new Date(meta.analyzed_at).toLocaleString('ja-JP') + '</div>';
    }
    if (meta.analysis_duration_ms) {
      html += '<div>処理時間: ' + (meta.analysis_duration_ms / 1000).toFixed(1) + '秒</div>';
    }
    if (meta.vision_used) {
      html += '<div><span class="badge badge-high" style="font-size:10px;padding:1px 6px">Vision API使用</span></div>';
    }
    html += '</div>';
  }

  // Share button - generates persistent share URL
  if (analysisId) {
    html += '<button class="btn btn-primary w-full" id="shareBtn" data-analysis-id="' + escAttr(analysisId) + '">';
    html += '\u{1F517} 共有URLを生成';
    html += '</button>';
    html += '<div id="shareResult" style="display:none;margin-top:8px;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;font-size:12px"></div>';
  }

  // Link to full results on web dashboard
  if (analysisId) {
    html += '<a class="dashboard-link" href="' + DASHBOARD_URL + '/analysis/' + escAttr(analysisId) + '" target="_blank">';
    html += 'Webダッシュボードで詳細を見る';
    html += '</a>';
  }

  // New analysis button
  html += '<button class="btn btn-outline w-full new-analysis-btn" id="newAnalysisBtn">';
  html += '新しい分析を開始';
  html += '</button>';

  container.innerHTML = html;

  // Bind new analysis button
  document.getElementById('newAnalysisBtn')?.addEventListener('click', function () {
    showScreen('input');
    loadCurrentTab();
  });

  // Bind share button
  document.getElementById('shareBtn')?.addEventListener('click', async function () {
    var btn = this;
    var id = btn.getAttribute('data-analysis-id');
    var resultDiv = document.getElementById('shareResult');
    if (!id || !resultDiv) return;

    btn.disabled = true;
    btn.textContent = '生成中...';

    try {
      var response = await fetch(API_BASE + '/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: id }),
      });

      if (!response.ok) throw new Error('共有URLの生成に失敗しました');
      var shareData = await response.json();
      var shareUrl = shareData.share_url || (DASHBOARD_URL + '/share/' + shareData.share_id);

      resultDiv.style.display = 'block';
      resultDiv.innerHTML =
        '<div style="font-weight:600;margin-bottom:4px;color:var(--primary)">共有URL（90日間有効）</div>' +
        '<input type="text" value="' + escAttr(shareUrl) + '" readonly ' +
        'style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:4px;font-size:11px;font-family:monospace;background:white" ' +
        'onclick="this.select()" />' +
        '<button class="btn btn-primary w-full" style="margin-top:6px" id="copyShareBtn">URLをコピー</button>';

      document.getElementById('copyShareBtn')?.addEventListener('click', async function () {
        try {
          await navigator.clipboard.writeText(shareUrl);
          this.textContent = '\u2713 コピーしました';
          setTimeout(function () {
            var copyBtn = document.getElementById('copyShareBtn');
            if (copyBtn) copyBtn.textContent = 'URLをコピー';
          }, 2000);
        } catch (e) { /* clipboard API not available */ }
      });

      btn.textContent = '\u2713 生成完了';
    } catch (err) {
      resultDiv.style.display = 'block';
      resultDiv.textContent = err.message || '共有URLの生成に失敗しました';
      resultDiv.style.color = 'var(--danger, red)';
      btn.textContent = '\u{1F517} 共有URLを生成';
      btn.disabled = false;
    }
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

  if (issue.evidence) {
    html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;padding:6px 8px;background:var(--bg);border-radius:4px">';
    html += '根拠: ' + escHtml(issue.evidence);
    html += '</div>';
  }

  // Brief (simplified)
  if (issue.brief) {
    var brief = issue.brief;
    if (brief.direction) {
      html += '<div class="diff">';
      html += '<div class="diff-label">改善の方向性</div>';
      html += '<div class="diff-after">' + escHtml(brief.direction) + '</div>';
      html += '</div>';
    }
  }

  // Badges
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
