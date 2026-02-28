# FeedEater 開発者向けガイド

このドキュメントでは、FeedEaterの開発環境セットアップ、技術スタック、およびアーキテクチャの概要について説明します。

## 技術スタック
- **デスクトップアプリ基盤**: Electron (Node.js)
- **フロントエンドUI**: React + TypeScript (ビルドツール: Vite)
- **スタイリング**: Vanilla CSS (3ペインレイアウト)
- **データベース**: `better-sqlite3` (ローカルキャッシュ・データ永続化)
- **RSSパース**: `rss-parser`

## 開発環境セットアップ

### 必須要件
- Node.js (v18以降推奨)
- npm

### インストールと起動手順
1. パッケージのインストール
   ```sh
   npm install
   ```

2. ネイティブモジュールのリビルド
   SQLiteを使用しているため、ElectronのNodeバージョンに合わせてバイナリをリビルドする必要があります。
   ```sh
   npx electron-rebuild -f -w better-sqlite3
   ```

3. 開発サーバーの起動
   Viteの開発サーバーとElectronが同時に立ち上がります。
   ```sh
   npm run dev
   ```

## アーキテクチャ概要

### プロセス構成
* **Main Process (`electron/main.ts`)**: 
  OSとの密接な連携、ウィンドウの管理、およびSQLiteデータベース(`better-sqlite3`)との安全な通信・RSSのフェッチを行います。
* **Renderer Process (`src/`)**: 
  Reactを使用してユーザーインターフェースを描画します。ここでは直接Node.jsのAPIは使用せず、セキュアなIPC通信を経由します。
* **Preload Script (`electron/preload.ts`)**: 
  MainプロセスとRendererプロセスのセキュアな橋渡し（Context Bridge）を行います。フロントエンドからは `window.api` として関数を呼び出せます。

### データベース
SQLiteデータベースファイル (`feedeater.sqlite`) は、各OSのユーザーデータディレクトリ（Windowsの場合は `%APPDATA%\feedeater\db\` などを想定）に生成されます。

## 今後の拡張に向けて
機能追加を行う際は、Mainプロセスの `electron/db/repository.ts` や `electron/services/rss.ts` でバックエンドロジックを実装し、`main.ts` で `ipcMain.handle` を追加、それを `preload.ts` と `src/types/index.ts` に型定義として露出させたあとにReactから呼び出す、というフローが基本となります。
