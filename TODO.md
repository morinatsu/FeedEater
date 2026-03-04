# TODO

## セキュリティ対策
- [x] **セキュアなコンテンツのみを読み込む (Only Load Secure Content)**
  - [Electron セキュリティベストプラクティス](https://www.electronjs.org/ja/docs/latest/tutorial/security#1-only-load-secure-content) 対応
  - ユーザーが `http://` のフィードURLを入力した場合のサニタイズ処理 ( `https://` への変換またはエラー表示 )
  - Electronの `webRequest` API を使用した、非セキュアな HTTP リクエストのブロック、または HTTPS へのリダイレクト処理の実装
  - CSP (Content Security Policy) の設定 (`<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">` など)

- [x] **リモートコンテンツからのセッション権限リクエストのハンドリング**
  - [Electron セキュリティベストプラクティス](https://www.electronjs.org/ja/docs/latest/tutorial/security#5-handle-session-permission-requests-from-remote-content) 対応
  - `session.setPermissionRequestHandler` を使用して、カメラ、マイク、位置情報などの不要な権限要求をすべて拒否する処理の実装

- [x] **file:// プロトコルの使用を避け、セキュアなプロトコルを使う**
  - [Electron セキュリティベストプラクティス](https://www.electronjs.org/ja/docs/latest/tutorial/security#18-avoid-usage-of-the-file-protocol-and-preferable-use-custom-protocols) 対応
  - ビルドされた `index.html` の読み込みを `file://` リクエストから、セキュリティ制限が予測しやすいカスタムプロトコル (`app://` など) またはインターセプトされたプロトコルへと変更する

- [x] **Electron Fuse (ヒューズ) の検証と変更**
  - [Electron セキュリティベストプラクティス](https://www.electronjs.org/ja/docs/latest/tutorial/security#19-check-which-fuses-you-can-change) 対応
  - `electron-builder` や専用のパッケージ設定で `runAsNode` などの不要な Electron の内部機能を無効化（Fuseを切り落とす）して攻撃対象領域を減らす
