# フィギュアコレクション管理アプリ

フィギュア収集者向けのスマートフォン対応 PWA（Progressive Web App）。
オフラインで動作し、ホーム画面に追加してネイティブアプリのように使えます。

## 機能

### 📦 発売情報管理
- 商品名・メーカー・シリーズ・発売日・定価・スケール・商品画像URLを登録
- 「発売前 / 予約中 / 発売済み」のステータス管理
- 発売日が近い順に自動ソート、ステータスでフィルタ
- 発売日までの残り日数を表示（7日以内は赤色で強調）

### 🛒 購入予定管理
- 「欲しい / 予約済み / 購入済み / 見送り」の4ステータスをワンタップで切り替え
- 購入日・購入価格・購入場所（店舗名/URL）を記録
- 月別の購入金額サマリーを自動集計
- 発売情報との紐付け（任意）

### 💰 フリマ価格調査メモ
- 商品ごとに複数の価格データを記録（調査日・プラットフォーム・価格・状態・URL）
- 平均・最高・最低価格を自動計算して定価と比較
- 対応プラットフォーム: メルカリ / ヤフオク / ラクマ / その他（手入力）
- ※ 各フリマサービスのAPIは使用せず、手動入力のみ

## 技術スタック

- **フレームワーク**: React 19 + Vite
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS v4（ダークモードはOS設定に追従）
- **PWA**: vite-plugin-pwa（Service Worker + Web App Manifest 自動生成）
- **データ永続化**: localStorage

## 開発

```bash
npm install
npm run dev      # 開発サーバー起動
npm run build    # 型チェック + 本番ビルド（dist/）
npm run preview  # ビルド成果物のプレビュー
npm run lint     # ESLint
```

スモークテスト（要ビルド + preview起動）:

```bash
npm run build
npm run preview &   # http://localhost:4173
npm run test:smoke
```

## ディレクトリ構成

```
src/
  components/    # 共通コンポーネント（BottomNav, Modal, StatusBadge 等）
  pages/         # 各画面（発売情報・購入予定・価格調査）
  hooks/         # カスタムフック（useLocalStorage）
  types/         # TypeScript型定義（Figure, PurchasePlan, PriceRecord）
  utils/         # 計算ロジック（価格統計・月別集計・日付処理）
scripts/
  gen-icons.cjs   # PWAアイコン（PNG）生成スクリプト
  smoke-test.mjs  # Playwrightによる動作確認スクリプト
```

## 今後の拡張候補

- 発売日7日前のWeb Push通知
- 画像アップロード（現状はURL指定のみ）
- データのエクスポート / インポート
