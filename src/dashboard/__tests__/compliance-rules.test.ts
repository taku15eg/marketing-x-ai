/**
 * Compliance Rules - Unit Tests
 *
 * ルールベースのコンプライアンス一次チェック機能のテスト。
 * 薬機法・景表法の禁止/要注意/要確認表現の検出精度を検証する。
 */

import { describe, it, expect } from 'vitest';
import {
  runCompliancePreCheck,
  mergeComplianceResults,
  _rules,
  _yakujihoRuleCount,
  _keihinhyoujihoRuleCount,
} from '../lib/compliance-rules';
import type { CompliancePreCheckResult } from '../lib/compliance-rules';

describe('Compliance Rules - Rule Registry', () => {
  it('has both yakujiho and keihinhyoujiho rules', () => {
    expect(_yakujihoRuleCount).toBeGreaterThan(0);
    expect(_keihinhyoujihoRuleCount).toBeGreaterThan(0);
  });

  it('all rules have required fields', () => {
    for (const rule of _rules) {
      expect(rule.id).toBeTruthy();
      expect(rule.law).toMatch(/^(yakujiho|keihinhyoujiho)$/);
      expect(rule.severity).toMatch(/^(prohibited|caution|review_recommended)$/);
      expect(rule.category).toBeTruthy();
      expect(rule.pattern).toBeInstanceOf(RegExp);
      expect(rule.reason).toBeTruthy();
      expect(rule.recommendation).toBeTruthy();
      expect(typeof rule.human_review_required).toBe('boolean');
    }
  });

  it('rule IDs are unique', () => {
    const ids = _rules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('yakujiho rules start with YK, keihinhyoujiho with KH', () => {
    for (const rule of _rules) {
      if (rule.law === 'yakujiho') {
        expect(rule.id).toMatch(/^YK/);
      } else {
        expect(rule.id).toMatch(/^KH/);
      }
    }
  });
});

describe('Compliance Rules - 薬機法 Detection', () => {
  describe('Prohibited expressions (prohibited)', () => {
    it('detects disease cure claims', () => {
      const result = runCompliancePreCheck('このサプリで糖尿病が治ります');
      const match = result.matches.find((m) => m.rule_id === 'YK001');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('prohibited');
      expect(match!.human_review_required).toBe(true);
    });

    it('detects cancer cure claims', () => {
      const result = runCompliancePreCheck('がんを克服できるサプリメント');
      const match = result.matches.find((m) => m.rule_id === 'YK001');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('prohibited');
    });

    it('detects cosmetic removal claims', () => {
      const result = runCompliancePreCheck('シミが消える美容液');
      const match = result.matches.find((m) => m.rule_id === 'YK002');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('prohibited');
    });

    it('detects wrinkle removal claims', () => {
      const result = runCompliancePreCheck('シワを完全に除去する');
      const match = result.matches.find((m) => m.rule_id === 'YK002');
      expect(match).toBeDefined();
    });

    it('detects guaranteed weight loss claims', () => {
      const result = runCompliancePreCheck('確実に痩せるダイエットサプリ');
      const match = result.matches.find((m) => m.rule_id === 'YK003');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('prohibited');
    });

    it('detects "just use it" drug-like claims', () => {
      const result = runCompliancePreCheck('飲むだけで痩せる');
      const match = result.matches.find((m) => m.rule_id === 'YK004');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('prohibited');
    });
  });

  describe('Caution expressions (caution)', () => {
    it('detects fatigue recovery claims', () => {
      const result = runCompliancePreCheck('疲れが取れるサプリメント');
      const match = result.matches.find((m) => m.rule_id === 'YK010');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('caution');
    });

    it('detects immune boost claims', () => {
      const result = runCompliancePreCheck('免疫力がアップする食品');
      const match = result.matches.find((m) => m.rule_id === 'YK011');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('caution');
    });

    it('detects before/after patterns', () => {
      const result = runCompliancePreCheck('ビフォー・アフター写真でこの効果を実感');
      const match = result.matches.find((m) => m.rule_id === 'YK012');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('caution');
      expect(match!.human_review_required).toBe(true);
    });

    it('detects anonymous doctor recommendation', () => {
      const result = runCompliancePreCheck('医師も推薦する健康食品');
      const match = result.matches.find((m) => m.rule_id === 'YK013');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('caution');
      expect(match!.human_review_required).toBe(true);
    });

    it('detects age-reversal claims', () => {
      const result = runCompliancePreCheck('-10歳肌を実現');
      const match = result.matches.find((m) => m.rule_id === 'YK015');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('caution');
    });

    it('detects personal testimonial markers', () => {
      const result = runCompliancePreCheck('個人の感想です');
      const match = result.matches.find((m) => m.rule_id === 'YK014');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('caution');
    });
  });

  describe('Review recommended expressions', () => {
    it('detects functional food labels', () => {
      const result = runCompliancePreCheck('機能性表示食品として届出済み');
      const match = result.matches.find((m) => m.rule_id === 'YK020');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('review_recommended');
      expect(match!.human_review_required).toBe(true);
    });

    it('detects natural-equals-safe claims', () => {
      const result = runCompliancePreCheck('天然だから安心');
      const match = result.matches.find((m) => m.rule_id === 'YK021');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('review_recommended');
    });
  });
});

describe('Compliance Rules - 景品表示法 Detection', () => {
  describe('Prohibited expressions', () => {
    it('detects unsourced No.1 claims', () => {
      const result = runCompliancePreCheck('業界No.1の実績');
      const match = result.matches.find((m) => m.rule_id === 'KH001');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('prohibited');
      expect(match!.law).toBe('keihinhyoujiho');
    });

    it('does not flag No.1 with source citation', () => {
      const result = runCompliancePreCheck('業界No.1の実績 ※2024年○○リサーチ調べ');
      const match = result.matches.find((m) => m.rule_id === 'KH001');
      expect(match).toBeUndefined();
    });

    it('detects double pricing patterns', () => {
      const result = runCompliancePreCheck('通常価格 ¥10,000 → ¥4,980');
      const match = result.matches.find((m) => m.rule_id === 'KH002');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('prohibited');
    });
  });

  describe('Caution expressions', () => {
    it('detects high satisfaction rate claims', () => {
      const result = runCompliancePreCheck('満足度 98%');
      const match = result.matches.find((m) => m.rule_id === 'KH010');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('caution');
    });

    it('detects urgency/scarcity tactics', () => {
      const result = runCompliancePreCheck('今だけ特別価格');
      const match = result.matches.find((m) => m.rule_id === 'KH011');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('caution');
    });

    it('detects quantity-limited claims', () => {
      const result = runCompliancePreCheck('残りわずか！お早めに');
      const match = result.matches.find((m) => m.rule_id === 'KH011');
      expect(match).toBeDefined();
    });

    it('detects achievement number claims', () => {
      const result = runCompliancePreCheck('累計100万個突破');
      const match = result.matches.find((m) => m.rule_id === 'KH012');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('caution');
    });
  });

  describe('Review recommended expressions', () => {
    it('detects comparison advertising patterns', () => {
      const result = runCompliancePreCheck('他社と比べ3倍の効果');
      const match = result.matches.find((m) => m.rule_id === 'KH021');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('review_recommended');
    });
  });
});

describe('Compliance Rules - runCompliancePreCheck', () => {
  it('returns empty matches for compliant text', () => {
    const result = runCompliancePreCheck('当社の製品について詳しくはお問い合わせください。');
    expect(result.matches).toHaveLength(0);
    expect(result.total_prohibited).toBe(0);
    expect(result.total_caution).toBe(0);
    expect(result.total_review).toBe(0);
  });

  it('counts severity levels correctly', () => {
    const text = 'シミが消える美容液。医師も推薦。機能性表示食品。';
    const result = runCompliancePreCheck(text);
    expect(result.total_prohibited).toBeGreaterThan(0);
    expect(result.total_caution).toBeGreaterThan(0);
    expect(result.total_review).toBeGreaterThan(0);
  });

  it('sorts results by severity (prohibited first)', () => {
    const text = '天然だから安心。シミが消える。免疫力がアップ。';
    const result = runCompliancePreCheck(text);
    expect(result.matches.length).toBeGreaterThan(1);

    const severities = result.matches.map((m) => m.severity);
    const prohibitedIdx = severities.indexOf('prohibited');
    const cautionIdx = severities.indexOf('caution');
    const reviewIdx = severities.indexOf('review_recommended');

    if (prohibitedIdx !== -1 && cautionIdx !== -1) {
      expect(prohibitedIdx).toBeLessThan(cautionIdx);
    }
    if (cautionIdx !== -1 && reviewIdx !== -1) {
      expect(cautionIdx).toBeLessThan(reviewIdx);
    }
  });

  it('deduplicates same matched text within same rule', () => {
    const text = 'シミが消える。使い続ければシミが消える。';
    const result = runCompliancePreCheck(text);
    const yk002Matches = result.matches.filter((m) => m.rule_id === 'YK002');
    // Same matched text should appear only once per rule
    expect(yk002Matches.length).toBe(1);
  });

  it('includes disclaimer in result', () => {
    const result = runCompliancePreCheck('テスト');
    expect(result.disclaimer).toContain('法的助言ではありません');
    expect(result.disclaimer).toContain('専門家');
  });

  it('includes checked_at timestamp', () => {
    const result = runCompliancePreCheck('テスト');
    expect(result.checked_at).toBeTruthy();
    expect(() => new Date(result.checked_at)).not.toThrow();
  });
});

describe('Compliance Rules - mergeComplianceResults', () => {
  const basePreCheck: CompliancePreCheckResult = {
    matches: [
      {
        matched_text: 'シミが消える',
        rule_id: 'YK002',
        law: 'yakujiho',
        severity: 'prohibited',
        category: '効果効能の断定',
        reason: 'ルールベースの理由',
        recommendation: 'ルールベースの推奨',
        human_review_required: true,
      },
    ],
    checked_at: new Date().toISOString(),
    total_prohibited: 1,
    total_caution: 0,
    total_review: 0,
    disclaimer: 'テスト用免責事項',
  };

  it('includes rule-based results with source=rule', () => {
    const merged = mergeComplianceResults(basePreCheck, undefined);
    expect(merged.yakujiho_risks).toHaveLength(1);
    expect(merged.yakujiho_risks[0].source).toBe('rule');
    expect(merged.yakujiho_risks[0].rule_id).toBe('YK002');
  });

  it('includes LLM-only results with source=llm', () => {
    const emptyPreCheck: CompliancePreCheckResult = {
      matches: [],
      checked_at: new Date().toISOString(),
      total_prohibited: 0,
      total_caution: 0,
      total_review: 0,
      disclaimer: '',
    };
    const llmResult = {
      yakujiho_risks: [{
        expression: 'LLM検出表現',
        risk_level: 'high',
        reason: 'LLMの理由',
        recommendation: 'LLMの推奨',
      }],
      keihinhyoujiho_risks: [],
    };
    const merged = mergeComplianceResults(emptyPreCheck, llmResult);
    expect(merged.yakujiho_risks).toHaveLength(1);
    expect(merged.yakujiho_risks[0].source).toBe('llm');
  });

  it('merges overlapping results with source=both', () => {
    const llmResult = {
      yakujiho_risks: [{
        expression: 'シミが消える化粧品',
        risk_level: 'high',
        reason: 'LLMによる詳細な理由説明がここに入ります',
        recommendation: 'LLMによる詳細な推奨対応がここに入ります',
      }],
      keihinhyoujiho_risks: [],
    };
    const merged = mergeComplianceResults(basePreCheck, llmResult);
    expect(merged.yakujiho_risks).toHaveLength(1);
    expect(merged.yakujiho_risks[0].source).toBe('both');
    expect(merged.yakujiho_risks[0].llm_reason).toBeTruthy();
  });

  it('preserves pre_check_summary', () => {
    const merged = mergeComplianceResults(basePreCheck, undefined);
    expect(merged.pre_check_summary.total_prohibited).toBe(1);
    expect(merged.pre_check_summary.checked_at).toBeTruthy();
  });

  it('preserves disclaimer', () => {
    const merged = mergeComplianceResults(basePreCheck, undefined);
    expect(merged.disclaimer).toBe('テスト用免責事項');
  });

  it('handles keihinhyoujiho risks separately', () => {
    const preCheck: CompliancePreCheckResult = {
      matches: [
        {
          matched_text: '業界No.1',
          rule_id: 'KH001',
          law: 'keihinhyoujiho',
          severity: 'prohibited',
          category: '優良誤認',
          reason: 'テスト',
          recommendation: 'テスト',
          human_review_required: true,
        },
      ],
      checked_at: new Date().toISOString(),
      total_prohibited: 1,
      total_caution: 0,
      total_review: 0,
      disclaimer: '',
    };
    const merged = mergeComplianceResults(preCheck, undefined);
    expect(merged.yakujiho_risks).toHaveLength(0);
    expect(merged.keihinhyoujiho_risks).toHaveLength(1);
    expect(merged.keihinhyoujiho_risks[0].law).toBeUndefined(); // law is not part of MergedRegulatoryRisk
    expect(merged.keihinhyoujiho_risks[0].rule_id).toBe('KH001');
  });
});

describe('Compliance Rules - Real-world Test Scenarios', () => {
  it('detects multiple issues in supplement LP text', () => {
    const text = `
      疲れが取れるサプリメント「元気MAX」
      医師も推薦する健康食品です。
      飲むだけで疲労回復！
      満足度 95%のお客様にご愛用いただいています。
      今だけ特別価格 通常価格 ¥8,000 → ¥3,980
      個人の感想です
    `;
    const result = runCompliancePreCheck(text);
    expect(result.matches.length).toBeGreaterThanOrEqual(4);
    expect(result.total_caution).toBeGreaterThan(0);
  });

  it('detects issues in cosmetics LP text', () => {
    const text = `
      シミが消える美白美容液
      -10歳肌を実現する革新的スキンケア
      Before & After で効果を実感
      ニキビがなくなる
    `;
    const result = runCompliancePreCheck(text);
    expect(result.total_prohibited).toBeGreaterThanOrEqual(2);
    expect(result.total_caution).toBeGreaterThanOrEqual(1);
  });

  it('handles clean corporate LP without false positives', () => {
    const text = `
      株式会社テスト
      私たちは企業のDX推進をサポートします。
      お問い合わせはこちら
      サービス一覧
      会社概要
      プライバシーポリシー
    `;
    const result = runCompliancePreCheck(text);
    expect(result.matches).toHaveLength(0);
  });
});
