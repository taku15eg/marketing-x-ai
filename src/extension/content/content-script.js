/**
 * Publish Gate v0.5 - Content Script
 * DOM feature extraction and PII masking.
 *
 * NOTE: Phase 0.5 では未使用。現在の設計では「URLを入れるだけで全部出る」思想に基づき、
 * 分析パイプライン（企業調査→ページ読取→診断→提案）はサーバーサイドで完結する。
 * このスクリプトは将来フェーズでクライアントサイドDOM抽出が必要になった場合に備えて保持。
 *
 * 使用する場合:
 * 1. manifest.json に "scripting" パーミッションを追加
 * 2. service-worker.js で chrome.scripting.executeScript を使って注入
 * 3. dashboard API 側で page_features を受け取る処理を追加
 *
 * SECURITY: This file contains NO API keys or sensitive logic.
 * All API communication happens in the service worker.
 */
(function () {
  if (window.__publishGate) return; // Prevent double injection

  // --- PII Masking ---
  const MASK = [
    { re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, to: '[EMAIL]' },
    { re: /0\d{1,4}-?\d{1,4}-?\d{3,4}/g, to: '[PHONE]' },
    { re: /\d{3}-?\d{4}/g, to: '[ZIPCODE]' },
  ];

  function mask(text) {
    if (!text) return '';
    let t = text;
    for (const m of MASK) t = t.replace(m.re, m.to);
    return t.trim();
  }

  // --- Unique CSS Selector Generator ---
  function uniqueSelector(el) {
    if (el.id) return '#' + CSS.escape(el.id);
    const parts = [];
    let cur = el;
    while (cur && cur !== document.body) {
      let selector = cur.tagName.toLowerCase();
      if (cur.id) {
        parts.unshift('#' + CSS.escape(cur.id));
        break;
      }
      if (cur.className && typeof cur.className === 'string') {
        const cls = cur.className
          .trim()
          .split(/\s+/)
          .filter(c => c && !c.startsWith('_'))
          .slice(0, 2)
          .map(c => '.' + CSS.escape(c))
          .join('');
        if (cls) selector += cls;
      }
      const parent = cur.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === cur.tagName);
        if (siblings.length > 1) {
          selector += ':nth-of-type(' + (siblings.indexOf(cur) + 1) + ')';
        }
      }
      parts.unshift(selector);
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  }

  // --- DOM Feature Extraction ---
  function extractFeatures() {
    try {
      const doc = document;

      // Meta information
      const meta = {
        title: mask(doc.title),
        description: mask(doc.querySelector('meta[name="description"]')?.content || ''),
        canonical: doc.querySelector('link[rel="canonical"]')?.href || '',
        og_title: mask(doc.querySelector('meta[property="og:title"]')?.content || ''),
        og_description: mask(doc.querySelector('meta[property="og:description"]')?.content || ''),
        og_type: doc.querySelector('meta[property="og:type"]')?.content || '',
        robots: doc.querySelector('meta[name="robots"]')?.content || '',
        lang: doc.documentElement.lang || '',
      };

      // Headings (h1, h2, h3)
      const headings = {};
      for (const level of ['h1', 'h2', 'h3']) {
        headings[level] = Array.from(doc.querySelectorAll(level))
          .slice(0, 15)
          .map(el => ({
            text: mask(el.textContent.substring(0, 120)),
            selector: uniqueSelector(el),
          }));
      }

      // CTA elements
      const ctas = [];
      const ctaSelectors = [
        'a[href*="contact"]', 'a[href*="inquiry"]', 'a[href*="demo"]',
        'a[href*="trial"]', 'a[href*="signup"]', 'a[href*="register"]',
        'a[href*="request"]', 'a[href*="download"]',
        'button[type="submit"]', '.cta', '[class*="cta"]',
        '[class*="btn-primary"]', '[data-cta]',
      ].join(', ');
      doc.querySelectorAll(ctaSelectors).forEach((el, i) => {
        if (i >= 10) return;
        const rect = el.getBoundingClientRect();
        ctas.push({
          text: mask(el.textContent.substring(0, 80)),
          href: el.href || '',
          selector: uniqueSelector(el),
          position: { top: Math.round(rect.top), left: Math.round(rect.left) },
          is_visible: rect.width > 0 && rect.height > 0,
        });
      });

      // Images (alt text, dimensions)
      const images = Array.from(doc.querySelectorAll('img'))
        .slice(0, 20)
        .map(img => ({
          alt: mask(img.alt || ''),
          src: img.src || '',
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          is_above_fold: img.getBoundingClientRect().top < window.innerHeight,
        }));

      // FV (First View) text extraction - top 1000px
      const fv_texts = [];
      const fvElements = doc.querySelectorAll('h1, h2, h3, p, span, li, a, div');
      for (const el of fvElements) {
        const rect = el.getBoundingClientRect();
        const text = el.textContent?.trim();
        if (rect.top >= 0 && rect.top < 1000 && text && text.length > 10 && el.children.length === 0) {
          fv_texts.push(mask(text.substring(0, 200)));
        }
        if (fv_texts.length >= 30) break;
      }

      // CTA surrounding context
      const cta_contexts = [];
      ctas.forEach((cta, i) => {
        if (i >= 5) return;
        try {
          const ctaEl = doc.querySelector(cta.selector);
          if (!ctaEl) return;
          const parent = ctaEl.closest('section, article, div[class]') || ctaEl.parentElement;
          if (!parent) return;
          cta_contexts.push({
            cta_text: cta.text,
            surrounding_copy: mask(parent.textContent.trim().substring(0, 400)),
          });
        } catch (_) { /* ignore selector errors */ }
      });

      // Forms
      const forms = [];
      doc.querySelectorAll('form').forEach((form, i) => {
        if (i >= 5) return;
        const fields = Array.from(form.querySelectorAll('input, select, textarea'))
          .slice(0, 20)
          .map(f => ({
            type: f.type || f.tagName.toLowerCase(),
            name: f.name || '',
            placeholder: mask(f.placeholder || ''),
          }));
        forms.push({
          action: form.action || '',
          method: form.method || 'get',
          fields,
          selector: uniqueSelector(form),
        });
      });

      // Navigation links
      const navigation = [];
      const nav = doc.querySelector('nav') || doc.querySelector('header');
      if (nav) {
        nav.querySelectorAll('a[href]').forEach((a, i) => {
          if (i >= 20) return;
          navigation.push({
            text: mask(a.textContent.substring(0, 50)),
            href: a.href,
          });
        });
      }

      // Structured data (JSON-LD)
      let structuredData = null;
      const jsonLd = doc.querySelector('script[type="application/ld+json"]');
      if (jsonLd) {
        try {
          const parsed = JSON.parse(jsonLd.textContent);
          structuredData = {
            type: parsed['@type'] || 'Unknown',
            name: mask(parsed.name || ''),
          };
        } catch (_) { /* ignore parse errors */ }
      }

      // Page statistics
      const links = doc.querySelectorAll('a[href]');
      const hasStickyEl = !!doc.querySelector(
        '[style*="position: fixed"], [style*="position: sticky"], [class*="sticky"], [class*="fixed"]'
      );

      const stats = {
        word_count: doc.body?.innerText?.length || 0,
        link_count: links.length,
        image_count: doc.querySelectorAll('img').length,
        form_count: doc.querySelectorAll('form').length,
        cta_count: ctas.length,
        heading_depth: headings.h3.length > 0 ? 3 : headings.h2.length > 0 ? 2 : headings.h1.length > 0 ? 1 : 0,
        has_sticky_cta: hasStickyEl,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        scroll_height: doc.documentElement.scrollHeight,
      };

      return {
        meta,
        headings,
        ctas,
        cta_contexts,
        fv_texts,
        forms,
        navigation,
        images,
        structured_data: structuredData,
        stats,
        extracted_at: new Date().toISOString(),
      };
    } catch (e) {
      return { error: e.message };
    }
  }

  // --- Expose API (extraction only - no apply/rollback in Phase 0.5) ---
  window.__publishGate = { extractFeatures };
})();
