# OshiQuest 🌟

OshiQuest（推しクエスト）は、あなたの「推し活」を記録し、推しと一緒にレベルアップしていくためのReact Native（Expo）製モバイルアプリケーションです。

日々の推し活（ライブ参加、グッズ購入、聖地巡礼など）を写真とともに記録することで経験値（EXP）を獲得し、推しのレベルを上げたり、特別なメモリアルアイテムを集めたりすることができます。

## ✨ 主な機能

- **推し登録 & プロフィール管理**: 複数の「推し」を登録し、それぞれのレベルやEXP状況を確認できます。
- **推し活アクションの記録**: アクティビティ種別（ライブ、イベント、グッズなど）、日付、場所、思い出のテキスト、そして写真をセットにして「推し活履歴」として保存します。
- **EXPシステムとレベルアップ**: 記録するたびにEXPを獲得！連続して記録するとストリークボーナスも付与されます。
- **アイテムドロップ**: レベルアップ時などに、推しを彩る特別なバッジやデコレーションアイテムがドロップします。

## 🛠 技術スタック

- **Frontend**: [React Native](https://reactnative.dev/) / [Expo](https://expo.dev/) (Expo Router)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Language**: TypeScript

## 🚀 ローカル環境の構築手順

このプロジェクトを手元で動かすための手順です。

### 1. リポジトリのクローンと依存解決

```bash
git clone <your-repo-url>
cd OshiQuest
npm install
```

### 2. 環境変数の設定

プロジェクト直下に `.env` ファイルを作成し、Supabaseの接続情報を記述します。（`.env.example` を参考にしてください）

```env
EXPO_PUBLIC_SUPABASE_URL=あなたのSupabase_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=あなたのSupabase_Anon_Key
```

### 3. アプリの起動

```bash
# iOSシミュレーターで起動する場合
npm run ios

# Androidエミュレーターで起動する場合
npm run android

# Webブラウザでプレビューする場合
npm run web
```

## 🗄 データベースのセットアップ (Supabase)

Supabaseプロジェクトに以下の設定が必要です。
1. **Tables**: `users`, `oshi`, `activity_logs`, `items`, `user_items` などのテーブル（`supabase/migrations/001_initial_schema.sql` 参照）
2. **Storage Buckets**: 写真保存用に `activity-photos` と `oshi-images` という名前のPublicバケットを作成してください。（`supabase/migrations/002_storage_buckets.sql` 参照）

## 📜 ライセンス

MIT License
