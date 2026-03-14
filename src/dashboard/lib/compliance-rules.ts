// Rule-based Compliance Pre-Check
// 薬機法・景表法の一次チェックをルールベースで実施
// LLM単独依存から脱却し、見逃しリスクを低減する
//
// 注意: このモジュールは法的助言を提供するものではありません。
// 最終的な法令適合性の判断は必ず専門家に相談してください。

export type ComplianceSeverity = 'prohibited' | 'caution' | 'review_recommended';

export type ComplianceLaw = 'yakujiho' | 'keihinhyoujiho';

export interface ComplianceRuleMatch {
  matched_text: string;
  rule_id: string;
  law: ComplianceLaw;
  severity: ComplianceSeverity;
  category: string;
  reason: string;
  recommendation: string;
  human_review_required: boolean;
}

export interface CompliancePreCheckResult {
  matches: ComplianceRuleMatch[];
  checked_at: string;
  total_prohibited: number;
  total_caution: number;
  total_review: number;
  disclaimer: string;
}

interface ComplianceRule {
  id: string;
  law: ComplianceLaw;
  severity: ComplianceSeverity;
  category: string;
  pattern: RegExp;
  reason: string;
  recommendation: string;
  human_review_required: boolean;
}

// === 薬機法ルール ===
const YAKUJIHO_RULES: ComplianceRule[] = [
  // --- prohibited: 明確な法令違反表現 ---
  {
    id: 'YK001',
    law: 'yakujiho',
    severity: 'prohibited',
    category: '効果効能の断定',
    pattern: /(?:病気|疾患|疾病|がん|癌|ガン|糖尿病|高血圧|アトピー|うつ|鬱)(?:が|を|に)?(?:治り|治る|治し|治す|治ります|治せ|治療|治癒|完治|克服|改善する|消える|なくなる)/,
    reason: '医薬品でない製品による疾病の治療・治癒を暗示する表現は薬機法第68条で禁止されています',
    recommendation: '疾病名と効果効能の断定を削除し、製品の一般的な特徴の説明に留めてください',
    human_review_required: true,
  },
  {
    id: 'YK002',
    law: 'yakujiho',
    severity: 'prohibited',
    category: '効果効能の断定',
    pattern: /(?:シミ|しみ|シワ|しわ|そばかす|ソバカス|ニキビ|にきび|吹き出物|たるみ|タルミ|毛穴)(?:が|を|に)?(?:消え|消す|消滅|除去|なくな|完全に|根本から)/,
    reason: '化粧品による肌トラブルの完全な除去・消滅を断定する表現は薬機法上認められません',
    recommendation: '「目立たなくする」「ケアする」等、穏当な表現に変更してください',
    human_review_required: true,
  },
  {
    id: 'YK003',
    law: 'yakujiho',
    severity: 'prohibited',
    category: '効果効能の断定',
    pattern: /(?:(?:確実|必ず|絶対|100%|間違いなく)(?:に)?(?:痩せ|やせ|ダイエット|減量)|(?:痩せ|やせ|ダイエット|減量|脂肪)(?:が|を|に|の)?(?:確実|必ず|絶対|100%|間違いなく|保証))/,
    reason: '健康食品・サプリメントによる痩身効果の保証は薬機法・健康増進法で禁止されています',
    recommendation: '効果の保証表現を削除し、適切な生活習慣と組み合わせた説明にしてください',
    human_review_required: true,
  },
  {
    id: 'YK004',
    law: 'yakujiho',
    severity: 'prohibited',
    category: '医薬品的効能の標榜',
    pattern: /(?:飲む|塗る|使う|摂取する|服用)だけで(?:治|痩|細|若|美白|改善)/,
    reason: '製品の使用のみで医薬品的効能が得られるかのような表現は薬機法違反の可能性が高いです',
    recommendation: '「〜だけで」という排他的な効果表現を削除してください',
    human_review_required: true,
  },

  // --- caution: 要注意表現 ---
  {
    id: 'YK010',
    law: 'yakujiho',
    severity: 'caution',
    category: '効果を暗示する表現',
    pattern: /(?:疲れ|疲労)(?:が|を)?(?:取れ|回復|解消|吹き飛|スッキリ)/,
    reason: '疲労回復効果を暗示する表現は、医薬品的な効能の標榜とみなされる可能性があります',
    recommendation: '「休息をサポート」等の穏当な表現を検討してください。断定を避けてください',
    human_review_required: false,
  },
  {
    id: 'YK011',
    law: 'yakujiho',
    severity: 'caution',
    category: '効果を暗示する表現',
    pattern: /(?:免疫|免疫力)(?:が|を)?(?:上が|向上|強化|アップ|高ま|ブースト)/,
    reason: '免疫機能への効果を暗示する表現は薬機法上の問題となる可能性があります',
    recommendation: '「健康的な毎日をサポート」等、身体機能への直接的効果を避けた表現にしてください',
    human_review_required: false,
  },
  {
    id: 'YK012',
    law: 'yakujiho',
    severity: 'caution',
    category: 'Before/After表現',
    pattern: /(?:ビフォー\s*(?:・|&|＆|アンド)\s*アフター|before\s*(?:\/|&)\s*after|使用前\s*(?:→|⇒|➡|→|▶|と)\s*使用後|(?:\d+(?:日|週間|ヶ月|か月|カ月))で(?:こんなに|ここまで|この(?:よう|通り)))/i,
    reason: 'Before/After写真や使用前後の比較は、薬機法上の効果効能の暗示とみなされることがあります',
    recommendation: '使用前後の比較表現には「個人の感想です。効果には個人差があります」の注記を必ず付けてください',
    human_review_required: true,
  },
  {
    id: 'YK013',
    law: 'yakujiho',
    severity: 'caution',
    category: '医師推薦',
    pattern: /(?:医師|ドクター|Dr\.|専門家|薬剤師)(?:が|も|の)?(?:推薦|推奨|おすすめ|オススメ|お墨付き|認め|太鼓判|監修)/,
    reason: '医師等の推薦には具体的な氏名・所属の明示が必要です。匿名の医師推薦は薬機法違反の可能性があります',
    recommendation: '推薦する医師の実名・所属・専門分野を明記してください',
    human_review_required: true,
  },
  {
    id: 'YK014',
    law: 'yakujiho',
    severity: 'caution',
    category: '体験談の注記不足',
    pattern: /(?:個人の(?:感想|体験|実感)|※個人|体験談|お客様の声|利用者の声)/,
    reason: '体験談を掲載する場合「個人の感想です。効果を保証するものではありません」等の注記が必要です',
    recommendation: '体験談の近くに「※個人の感想です。効果には個人差があります」を明記してください',
    human_review_required: false,
  },
  {
    id: 'YK015',
    law: 'yakujiho',
    severity: 'caution',
    category: '年齢訴求',
    pattern: /(?:[-−ー]\s*\d+歳|マイナス\s*\d+歳|\d+歳\s*(?:若[くい返]|若見え))/,
    reason: '具体的な若返り年数の表現は、効果効能の断定とみなされるリスクがあります',
    recommendation: '具体的な年数表現を避け、「年齢に応じたケア」等の表現にしてください',
    human_review_required: true,
  },

  // --- review_recommended: 要確認表現 ---
  {
    id: 'YK020',
    law: 'yakujiho',
    severity: 'review_recommended',
    category: '機能性表示との整合',
    pattern: /(?:機能性表示食品|栄養機能食品|特定保健用食品|トクホ)/,
    reason: '機能性表示食品等の表示がある場合、届出内容と実際の表示の整合性確認が必要です',
    recommendation: '届出番号と届出内容を確認し、表示が届出範囲内であることを検証してください',
    human_review_required: true,
  },
  {
    id: 'YK021',
    law: 'yakujiho',
    severity: 'review_recommended',
    category: '成分由来の暗示',
    pattern: /(?:天然|自然|オーガニック|無添加|植物由来|ナチュラル)(?:だから|なので|のため|で)?(?:安心|安全|副作用(?:なし|ない|がない))/,
    reason: '天然・自然由来であることを安全性の根拠とする表現は不適切とされる場合があります',
    recommendation: '「天然=安全」という論理構成を避け、品質管理体制等の客観的根拠を示してください',
    human_review_required: false,
  },
];

// === 景品表示法ルール ===
const KEIHINHYOUJIHO_RULES: ComplianceRule[] = [
  // --- prohibited: 明確な法令違反表現 ---
  {
    id: 'KH001',
    law: 'keihinhyoujiho',
    severity: 'prohibited',
    category: '優良誤認（根拠なしNo.1）',
    pattern: /(?:No\.?\s*1|ナンバーワン|ナンバー1|第1位|第一位|1位|業界(?:初|No\.?\s*1|ナンバーワン|トップ)|日本初|世界初|国内初|業界最|最安|最高品質|最上級)(?!.*(?:※|＊|\*|調査|出典|出所|調べ|データ|リサーチ|according))/,
    reason: '「No.1」「業界初」等の最上級表現には客観的な調査データの根拠が必要です（景表法第5条第1号）',
    recommendation: '調査機関名・調査時期・調査方法を明記してください。根拠がない場合は表現を削除してください',
    human_review_required: true,
  },
  {
    id: 'KH002',
    law: 'keihinhyoujiho',
    severity: 'prohibited',
    category: '有利誤認（二重価格）',
    pattern: /(?:通常(?:価格|料金)\s*(?:￥|¥|円)\s*[\d,]+.*?(?:→|⇒|➡|▶|が|を)\s*(?:￥|¥|円)?\s*[\d,]+|定価\s*(?:￥|¥|円)\s*[\d,]+.*?(?:特別|限定|今だけ|キャンペーン).*?(?:￥|¥|円)?\s*[\d,]+|\d+%\s*OFF|(?:半額|50%?\s*off))/i,
    reason: '二重価格表示は、比較対照価格が実際に相当期間販売されていた価格でなければ有利誤認となります',
    recommendation: '比較対照価格の販売実績（期間・時期）を確認し、根拠を明記してください',
    human_review_required: true,
  },

  // --- caution: 要注意表現 ---
  {
    id: 'KH010',
    law: 'keihinhyoujiho',
    severity: 'caution',
    category: '優良誤認リスク',
    pattern: /(?:満足度|リピート率|継続率|支持率|推奨率)\s*(?:\d{2,3})\s*(?:%|パーセント)/,
    reason: '高い数値の満足度等を表示する場合、調査の客観性・信頼性の根拠が必要です',
    recommendation: '調査機関・調査対象・調査方法・回答数を注記として明記してください',
    human_review_required: false,
  },
  {
    id: 'KH011',
    law: 'keihinhyoujiho',
    severity: 'caution',
    category: '有利誤認リスク',
    pattern: /(?:今だけ|期間限定|数量限定|残り(?:わずか|\d+)|限定\d+(?:個|名|本|セット)|先着\d+|早い者勝ち|なくなり次第)/,
    reason: '期間・数量限定表示が常態化している場合、有利誤認に該当する可能性があります',
    recommendation: '実際に限定であることを確認してください。常時表示している場合は削除を検討してください',
    human_review_required: false,
  },
  {
    id: 'KH012',
    law: 'keihinhyoujiho',
    severity: 'caution',
    category: '成果の根拠不足',
    pattern: /(?:売上|販売実績|導入実績|利用者数?|ユーザー数?|会員数?|累計)\s*(?:\d[\d,.]*)\s*(?:万?(?:個|本|件|社|人|名|以上|突破|達成))/,
    reason: '具体的な数値を含む実績表示は、その根拠データの正確性が求められます',
    recommendation: '数値の集計時点と根拠を明記してください（例: 2024年3月時点）',
    human_review_required: false,
  },

  // --- review_recommended: 要確認表現 ---
  {
    id: 'KH020',
    law: 'keihinhyoujiho',
    severity: 'review_recommended',
    category: '打消し表示の確認',
    pattern: /(?:※|＊|\*)(?:効果|結果|成果)(?:には|は)?(?:個人差|条件|環境)/,
    reason: '打消し表示（注釈）が十分な大きさ・位置で表示されているか確認が必要です',
    recommendation: '注記が本文と同等に認識しやすい大きさ・位置に配置されているか確認してください',
    human_review_required: false,
  },
  {
    id: 'KH021',
    law: 'keihinhyoujiho',
    severity: 'review_recommended',
    category: '比較広告',
    pattern: /(?:他社|競合|従来品|当社従来|比べ|比較)(?:と|に|より)?(?:\d+倍|\d+%|圧倒的|段違い|桁違い|格段)/,
    reason: '比較広告は比較対象を明確にし、客観的データに基づく必要があります',
    recommendation: '比較対象の商品名と比較条件を明記してください',
    human_review_required: false,
  },
];

const ALL_RULES: ComplianceRule[] = [...YAKUJIHO_RULES, ...KEIHINHYOUJIHO_RULES];

const COMPLIANCE_DISCLAIMER =
  'この法令チェックはルールベースの一次スクリーニングであり、法的助言ではありません。' +
  '最終的な適法性の判断は、必ず薬機法・景表法に精通した専門家（弁護士・薬事コンサルタント等）にご相談ください。' +
  '検出されなかった項目が適法であることを保証するものではありません。';

/**
 * テキストに対してルールベースのコンプライアンス一次チェックを実行する。
 * LLM呼び出し前に実行し、結果をLLM分析の補助情報として活用する。
 */
export function runCompliancePreCheck(textContent: string): CompliancePreCheckResult {
  const matches: ComplianceRuleMatch[] = [];

  for (const rule of ALL_RULES) {
    const regexMatches = textContent.matchAll(new RegExp(rule.pattern, 'g'));
    const seenTexts = new Set<string>();

    for (const match of regexMatches) {
      const matchedText = match[0];
      // 同一ルールで同一テキストの重複を除去
      if (seenTexts.has(matchedText)) continue;
      seenTexts.add(matchedText);

      matches.push({
        matched_text: matchedText,
        rule_id: rule.id,
        law: rule.law,
        severity: rule.severity,
        category: rule.category,
        reason: rule.reason,
        recommendation: rule.recommendation,
        human_review_required: rule.human_review_required,
      });
    }
  }

  // severity 順にソート: prohibited > caution > review_recommended
  const severityOrder: Record<ComplianceSeverity, number> = {
    prohibited: 0,
    caution: 1,
    review_recommended: 2,
  };
  matches.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    matches,
    checked_at: new Date().toISOString(),
    total_prohibited: matches.filter((m) => m.severity === 'prohibited').length,
    total_caution: matches.filter((m) => m.severity === 'caution').length,
    total_review: matches.filter((m) => m.severity === 'review_recommended').length,
    disclaimer: COMPLIANCE_DISCLAIMER,
  };
}

/**
 * ルールベースの結果をLLMの結果とマージする。
 * ルールベースで検出した項目はsource='rule'、LLMのみで検出した項目はsource='llm'、
 * 両方で検出した場合はsource='both'となる。
 */
export function mergeComplianceResults(
  preCheck: CompliancePreCheckResult,
  llmRegulatory: {
    yakujiho_risks: Array<{ expression: string; risk_level: string; reason: string; recommendation: string }>;
    keihinhyoujiho_risks: Array<{ expression: string; risk_level: string; reason: string; recommendation: string }>;
  } | undefined
): MergedRegulatoryCheck {
  const mergedYakujiho: MergedRegulatoryRisk[] = [];
  const mergedKeihin: MergedRegulatoryRisk[] = [];

  // ルールベースの結果を先に追加
  for (const match of preCheck.matches) {
    const entry: MergedRegulatoryRisk = {
      expression: match.matched_text,
      risk_level: severityToRiskLevel(match.severity),
      severity: match.severity,
      reason: match.reason,
      recommendation: match.recommendation,
      source: 'rule',
      rule_id: match.rule_id,
      category: match.category,
      human_review_required: match.human_review_required,
    };
    if (match.law === 'yakujiho') {
      mergedYakujiho.push(entry);
    } else {
      mergedKeihin.push(entry);
    }
  }

  // LLMの結果をマージ
  if (llmRegulatory) {
    for (const llmRisk of llmRegulatory.yakujiho_risks) {
      const existing = mergedYakujiho.find((r) => expressionOverlaps(r.expression, llmRisk.expression));
      if (existing) {
        existing.source = 'both';
        // LLMの reason/recommendation が詳細な場合は補完
        if (llmRisk.reason.length > existing.reason.length) {
          existing.llm_reason = llmRisk.reason;
        }
        if (llmRisk.recommendation.length > existing.recommendation.length) {
          existing.llm_recommendation = llmRisk.recommendation;
        }
      } else {
        mergedYakujiho.push({
          expression: llmRisk.expression,
          risk_level: (llmRisk.risk_level as 'high' | 'medium' | 'low') || 'medium',
          severity: riskLevelToSeverity(llmRisk.risk_level),
          reason: llmRisk.reason,
          recommendation: llmRisk.recommendation,
          source: 'llm',
          human_review_required: llmRisk.risk_level === 'high',
        });
      }
    }

    for (const llmRisk of llmRegulatory.keihinhyoujiho_risks) {
      const existing = mergedKeihin.find((r) => expressionOverlaps(r.expression, llmRisk.expression));
      if (existing) {
        existing.source = 'both';
        if (llmRisk.reason.length > existing.reason.length) {
          existing.llm_reason = llmRisk.reason;
        }
        if (llmRisk.recommendation.length > existing.recommendation.length) {
          existing.llm_recommendation = llmRisk.recommendation;
        }
      } else {
        mergedKeihin.push({
          expression: llmRisk.expression,
          risk_level: (llmRisk.risk_level as 'high' | 'medium' | 'low') || 'medium',
          severity: riskLevelToSeverity(llmRisk.risk_level),
          reason: llmRisk.reason,
          recommendation: llmRisk.recommendation,
          source: 'llm',
          human_review_required: llmRisk.risk_level === 'high',
        });
      }
    }
  }

  return {
    yakujiho_risks: mergedYakujiho,
    keihinhyoujiho_risks: mergedKeihin,
    pre_check_summary: {
      total_prohibited: preCheck.total_prohibited,
      total_caution: preCheck.total_caution,
      total_review: preCheck.total_review,
      checked_at: preCheck.checked_at,
    },
    disclaimer: preCheck.disclaimer,
  };
}

// === 型定義 ===

export interface MergedRegulatoryRisk {
  expression: string;
  risk_level: 'high' | 'medium' | 'low';
  severity: ComplianceSeverity;
  reason: string;
  recommendation: string;
  source: 'rule' | 'llm' | 'both';
  rule_id?: string;
  category?: string;
  human_review_required: boolean;
  llm_reason?: string;
  llm_recommendation?: string;
}

export interface MergedRegulatoryCheck {
  yakujiho_risks: MergedRegulatoryRisk[];
  keihinhyoujiho_risks: MergedRegulatoryRisk[];
  pre_check_summary: {
    total_prohibited: number;
    total_caution: number;
    total_review: number;
    checked_at: string;
  };
  disclaimer: string;
}

// === ヘルパー ===

function severityToRiskLevel(severity: ComplianceSeverity): 'high' | 'medium' | 'low' {
  switch (severity) {
    case 'prohibited': return 'high';
    case 'caution': return 'medium';
    case 'review_recommended': return 'low';
  }
}

function riskLevelToSeverity(riskLevel: string): ComplianceSeverity {
  switch (riskLevel) {
    case 'high': return 'prohibited';
    case 'medium': return 'caution';
    case 'low':
    default: return 'review_recommended';
  }
}

/**
 * 2つの表現テキストに重複があるか簡易判定する。
 * 一方が他方を含む場合を重複とみなす。
 */
function expressionOverlaps(a: string, b: string): boolean {
  const normA = a.replace(/\s+/g, '');
  const normB = b.replace(/\s+/g, '');
  return normA.includes(normB) || normB.includes(normA);
}

// テスト用にルール一覧をエクスポート
export const _rules = ALL_RULES;
export const _yakujihoRuleCount = YAKUJIHO_RULES.length;
export const _keihinhyoujihoRuleCount = KEIHINHYOUJIHO_RULES.length;
