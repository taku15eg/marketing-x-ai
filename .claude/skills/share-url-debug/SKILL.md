---
name: share-url-debug
description: >
  共有URL生成・バイラルループ・ソーシャルシェアのデバッグと改善を行う。
  Use when: 共有URLが動かない, シェアボタンの問題, OGPの修正,
  バイラル係数の改善, 'share', '共有', 'SNS', 'viral loop'。
---

# Share URL & Viral Loop — デバッグ＆改善

## バイラルループ構造

```
分析完了 → 共有URL生成（nanoid 21文字）
    ↓
共有ページ表示（/share/[id]）
    ↓
受け取った側が「自分のLPも分析する（無料）」CTA
    ↓
/?ref=share に遷移 → 新規分析
    ↓
繰り返し（バイラルループ完成）
```

## キーファイルマップ

| ファイル | 役割 |
|---------|------|
| `src/dashboard/app/api/share/route.ts` | 共有URL生成API |
| `src/dashboard/app/share/[id]/page.tsx` | 共有ページ表示 |
| `src/dashboard/components/ShareButton.tsx` | 共有ボタンUI |
| `src/dashboard/components/SocialShareButtons.tsx` | X/LINE/コピーボタン |
| `src/dashboard/components/PoweredByBadge.tsx` | PG導線バッジ |
| `src/dashboard/lib/event-logger.ts` | イベント計測 |

## セキュリティ要件

- **ID推測防止**: nanoid(21)以上。連番・タイムスタンプ禁止
- **OGPにURLを含めない**: 分析対象URLそのものはOGPに入れない
- **全出力物にPG導線**: PoweredByBadge を必ず含める

## 計測イベント

| イベント | タイミング |
|---------|-----------|
| `share_url_generated` | 共有URL生成時 |
| `share_page_viewed` | 共有ページ閲覧時 |
| `share_cta_clicked` | CTA（自分も分析する）クリック時 |

## β成功指標

**5名中3名が共有URL生成1回以上**

## 関連テスト

- `__tests__/security.test.ts` — Share ID推測防止テスト
- `e2e/share.spec.ts` — 共有フローE2E
- `__tests__/event-logger.test.ts` — イベント記録
