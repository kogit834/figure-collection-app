# フィギュアコレクション管理アプリ — Claude向けガイド

## プロジェクト概要

フィギュア収集者向けのスマートフォン対応PWA（Progressive Web App）。
React + Vite + TypeScript + Tailwind CSS v4 + vite-plugin-pwa で構築。
データはlocalStorageに保存（サーバー不使用）。

## 公開URL

**https://kogit834.github.io/figure-collection-app/**

mainブランチにpushされると GitHub Actions が自動でビルド・デプロイする。

## ディレクトリ構成

```
src/
  App.tsx              # ルート。タブ状態管理とlocalStorage読み書き
  main.tsx             # エントリーポイント
  index.css            # Tailwind + グローバルスタイル（.card, .input, .btn-* など）
  types/index.ts       # Figure, PurchasePlan, PriceRecord の型定義・定数
  hooks/
    useLocalStorage.ts # localStorage永続化フック
  utils/index.ts       # 価格統計・月別集計・日付処理などのユーティリティ
  components/
    BottomNav.tsx      # タブナビゲーション（発売情報 / 購入予定 / 価格調査）
    Modal.tsx          # ボトムシート型モーダル
    StatusBadge.tsx    # ステータス表示バッジ
    EmptyState.tsx     # 一覧が空のときの表示
  pages/
    FiguresPage.tsx    # 発売情報管理（一覧・追加・編集・削除・フィルタ）
    PurchasesPage.tsx  # 購入予定管理（ステータス切替・月別集計）
    PricesPage.tsx     # フリマ価格調査（記録・平均/最高/最低算出）
.github/workflows/
  deploy.yml           # GitHub Pages自動デプロイ
scripts/
  gen-icons.cjs        # PWAアイコンPNG生成（Node.js、依存なし）
  smoke-test.mjs       # Playwrightによる動作確認スクリプト
```

## 主要コマンド

```bash
npm run dev          # 開発サーバー起動（http://localhost:5173）
npm run build        # 型チェック + 本番ビルド → dist/
npm run lint         # ESLint
npm run preview      # ビルド成果物を http://localhost:4173 でプレビュー
npm run test:smoke   # Playwrightスモークテスト（要: npm run preview が起動中）
```

## ビルド・デプロイの仕組み

- `npm run build` は通常 `base=/` でビルドする
- GitHub Pagesへのデプロイ時は `BASE_PATH=/figure-collection-app/` を環境変数で指定する（deploy.ymlが自動でセット）
- manifest の `start_url` / `scope` も `base` に追従する（vite.config.ts参照）

## データ設計（localStorage キー）

| キー | 型 | 説明 |
|---|---|---|
| `fc:figures` | `Figure[]` | 商品発売情報 |
| `fc:plans` | `PurchasePlan[]` | 購入予定 |
| `fc:prices` | `PriceRecord[]` | フリマ価格調査メモ |

## UI設計方針

- スマホファースト、最大幅 480px
- ダークモードはOSの設定に自動追従（Tailwind の `dark:` クラス）
- モーダルはボトムシート形式（画面下から出てくる）
- ステータス変更はカード内のチップボタンでその場で切替
- フォームバリデーションはブラウザネイティブ（`required` 属性）のみ

## 実装済み機能

1. **発売情報管理**: 商品名・メーカー・シリーズ・発売日・定価・スケール・画像URL。ステータス（発売前/予約中/発売済み）フィルタ。発売日近い順ソート。残り日数表示（7日以内は赤）。
2. **購入予定管理**: 欲しい/予約済み/購入済み/見送りの4ステータス。購入日・価格・場所の記録。月別購入金額サマリー。発売情報との紐付け（任意）。
3. **フリマ価格調査**: メルカリ/ヤフオク/ラクマ/その他（手入力）の価格記録。平均・最高・最低の自動計算。定価との比較表示。

## 未実装（今後の拡張候補）

- Web Push通知（発売日7日前アラート）
- 画像アップロード（現状はURL指定のみ）
- データのエクスポート / インポート（CSV・JSON）
- 複数デバイス間のデータ同期

## 注意事項

- 各フリマサービス（メルカリ・ヤフオク・ラクマ）のAPIは**使用しない**。手動入力のみ。
- データはブラウザのlocalStorageに保存される。ブラウザデータ削除で消える。
- PWAアイコン（public/pwa-192x192.png, pwa-512x512.png）は `node scripts/gen-icons.cjs` で再生成可能。
