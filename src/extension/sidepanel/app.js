/**
 * Publish Gate v4.0 - Side Panel Application
 * Phase 0.5 MVP: URL pre-fill, analysis trigger, 4-step loading, results display.
 *
 * API response structure (v4 proposal model):
 * {
 *   id, url, status, result?: {
 *     company_understanding: { summary, industry, business_model, ... },
 *     page_reading: { page_type, fv_main_copy, primary_cta, confidence, ... },
 *     insight: "総括テキスト",
 *     proposals: [{
 *       id, category, impact, title,
 *       context: { business_role, page_strengths, element_role },
 *       evidence_chain: { observation, industry_trend, gap, hypothesis },
 *       before_after: { before, after },
 *       expected_impact: { primary_kpi, improvement_range, confidence, confidence_reason },
 *       caution, briefs: { designer, engineer }
 *     }],
 *     regulatory?: { yakujiho_risks, keihinhyoujiho_risks },
 *     metadata: { analyzed_at, analysis_duration_ms, vision_used, dom_extracted }
 *   }
 * }
 */

// --- Configuration (uses API_BASE from constants.js loaded in sidepanel.html) ---
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
  activeTab: 'analysis', // 'analysis' or 'experiment'
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
  document.getElementById('retryBtn').addEventListener('click', function () {
    showScreen('input');
    loadCurrentTab();
  });

  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tab = this.dataset.tab;
      state.activeTab = tab;
      document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
      var targetEl = document.getElementById('tab-' + tab);
      if (targetEl) targetEl.classList.add('active');
    });
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

  // Step 1: Company Research
  setLoadingStep(1, 'active');
  updateProgress(10);
  await delay(300);
  setLoadingStep(1, 'done');

  // Step 2: Page Reading
  setLoadingStep(2, 'active');
  updateProgress(30);
  await delay(300);
  setLoadingStep(2, 'done');

  // Step 3: AI Diagnosis
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

    setLoadingStep(3, 'done');
    updateProgress(85);

    // Step 4: Brief Generation
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
  document.querySelectorAll('.loading-step').forEach(function (step) {
    step.classList.remove('active', 'done');
    step.querySelector('.step-icon').textContent = '\u25CB';
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
    icon.textContent = '\u25D4';
  } else if (status === 'done') {
    step.classList.add('done');
    icon.textContent = '\u2713';
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

// --- Results Rendering (v4 Proposal Model) ---
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

  // Insight (replaces improvement_potential)
  if (result.insight) {
    html += '<div class="insight-card">';
    html += '<div class="insight-label">総合インサイト</div>';
    html += '<div class="insight-value">' + escHtml(result.insight) + '</div>';
    html += '</div>';
  }

  // Company Understanding
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

  // Page Reading
  if (result.page_reading) {
    var pr = result.page_reading;
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
    var reg = result.regulatory;
    var yakujiho = reg.yakujiho_risks || [];
    var keihin = reg.keihinhyoujiho_risks || [];
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

  // Proposals (v4 model — replaces issues)
  if (result.proposals && result.proposals.length > 0) {
    html += '<div class="section-title">改善提案 (' + result.proposals.length + '件)</div>';
    var sortedProposals = result.proposals.slice().sort(function (a, b) { return a.id - b.id; });
    sortedProposals.forEach(function (proposal) {
      html += renderProposalCard(proposal);
    });
  }

  // Metadata
  if (result.metadata) {
    var meta = result.metadata;
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

  // Bind expand/collapse for evidence chains
  container.querySelectorAll('.evidence-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.getElementById(this.dataset.target);
      if (target) {
        target.classList.toggle('expanded');
        this.textContent = target.classList.contains('expanded') ? '根拠を閉じる' : '根拠チェーンを見る';
      }
    });
  });
}

// --- v4 Proposal Card Renderer ---
function renderProposalCard(proposal) {
  var categoryLabels = { trust: '信頼性', cta: 'CTA', structure: '構成', copy: 'コピー' };
  var categoryColors = { trust: 'success', cta: 'primary', structure: 'purple', copy: 'warning' };
  var impactLabels = { high: '大', medium: '中', low: '小' };
  var categoryKey = categoryColors[proposal.category] || 'primary';
  var categoryLabel = categoryLabels[proposal.category] || proposal.category;

  var html = '<div class="proposal-card">';

  // Header
  html += '<div class="proposal-header">';
  html += '<div class="proposal-badges">';
  html += '<span class="badge badge-category-' + categoryKey + '">' + escHtml(categoryLabel) + '</span>';
  html += '<span class="badge badge-' + proposal.impact + '">影響度: ' + (impactLabels[proposal.impact] || proposal.impact) + '</span>';
  html += '</div>';
  html += '<div class="proposal-title">' + escHtml(proposal.title) + '</div>';
  html += '</div>';

  // Before/After
  if (proposal.before_after) {
    html += '<div class="before-after">';
    html += '<div class="ba-item ba-before">';
    html += '<div class="ba-label">Before</div>';
    html += '<div class="ba-text">' + escHtml(proposal.before_after.before) + '</div>';
    html += '</div>';
    html += '<div class="ba-item ba-after">';
    html += '<div class="ba-label">After</div>';
    html += '<div class="ba-text">' + escHtml(proposal.before_after.after) + '</div>';
    html += '</div>';
    html += '</div>';
  }

  // Expected Impact
  if (proposal.expected_impact) {
    var ei = proposal.expected_impact;
    html += '<div class="expected-impact">';
    if (ei.primary_kpi) {
      html += '<div class="ei-kpi">' + escHtml(ei.primary_kpi) + ': <strong>' + escHtml(ei.improvement_range) + '</strong></div>';
    }
    if (ei.confidence) {
      var confLabel = ei.confidence === 'high' ? '高' : ei.confidence === 'medium' ? '中' : '低';
      html += '<span class="badge badge-' + ei.confidence + '">確からしさ: ' + confLabel + '</span>';
    }
    html += '</div>';
  }

  // Evidence Chain (collapsible)
  if (proposal.evidence_chain) {
    var ecId = 'ec-' + proposal.id;
    html += '<button class="evidence-toggle" data-target="' + ecId + '">根拠チェーンを見る</button>';
    html += '<div class="evidence-chain" id="' + ecId + '">';

    var steps = [
      { key: 'observation', label: '現状', icon: '👁' },
      { key: 'industry_trend', label: '業界傾向', icon: '📊' },
      { key: 'gap', label: 'ギャップ', icon: '⚡' },
      { key: 'hypothesis', label: '仮説', icon: '💡' },
    ];

    steps.forEach(function (step) {
      var ec = proposal.evidence_chain[step.key];
      if (ec && ec.text) {
        var sourceLabel = getSourceLabel(ec.source);
        html += '<div class="ec-step">';
        html += '<div class="ec-step-header">';
        html += '<span class="ec-step-icon">' + step.icon + '</span>';
        html += '<span class="ec-step-label">' + step.label + '</span>';
        html += '<span class="ec-source badge-source-' + getSourceColor(ec.source) + '">' + escHtml(sourceLabel) + '</span>';
        html += '</div>';
        html += '<div class="ec-step-text">' + escHtml(ec.text) + '</div>';
        html += '</div>';
      }
    });

    html += '</div>';
  }

  // Caution
  if (proposal.caution) {
    html += '<div class="proposal-caution">';
    html += '<span class="caution-icon">&#9888;</span> ' + escHtml(proposal.caution);
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function getSourceLabel(source) {
  if (!source) return '推定';
  switch (source.type) {
    case 'fv_text': return 'FVテキスト';
    case 'page_structure': return 'ページ構造';
    case 'section': return source.name || 'セクション';
    case 'ai_knowledge': return 'AI知識ベース';
    case 'estimate': return '推定';
    default: return source.type || '推定';
  }
}

function getSourceColor(source) {
  if (!source) return 'gray';
  switch (source.type) {
    case 'fv_text':
    case 'page_structure':
    case 'section':
      return 'blue';
    case 'ai_knowledge':
      return 'purple';
    case 'estimate':
    default:
      return 'gray';
  }
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
