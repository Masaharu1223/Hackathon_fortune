# 一番くじアプリ - Implementation Progress

## Phase 0: プロジェクト基盤 ✅
- [x] モノレポ初期化 (npm workspaces)
- [x] TypeScript / ESLint / Prettier設定
- [x] 共有型定義パッケージ (shared)
- [x] CDKプロジェクトセットアップ (7 stacks)
- [x] Next.js App Router + static export設定 (10 pages)
- [x] Backend Lambda handlers (6 handlers + 4 services)
- [x] ビルド検証 (all packages build clean)

## Phase 1: 認証
- [x] Cognito User Pool (CDK) - auth-stack.ts
- [x] Google IdP設定 - UserPoolIdentityProviderGoogle
- [x] LINE OIDC IdP設定 - UserPoolIdentityProviderOidc
- [x] ログインページ実装 - /login page with Google/LINE buttons
- [x] トークン管理 (frontend) - auth.ts with localStorage
- [x] API Gateway + Cognito Authorizer - api-stack.ts
- [ ] `/users/me` エンドポイントで認証E2E検証 (requires AWS deploy)

## Phase 2: 店舗登録・検索
- [x] DynamoDB テーブル + Geo Table (CDK) - database-stack.ts
- [x] 店舗CRUD (admin API) - admin handler
- [x] geohashベース店舗作成 (dual-write) - geo service + admin handler
- [x] `/stores/nearby` 半径検索 - stores handler + geo service
- [x] 店舗検索UI (Geolocation API) - home page with radius selector
- [x] 店舗詳細ページ - /stores/detail?id=

## Phase 2.5: AWS Location Service 導入 ← NOW
- [ ] 2.5.1 CDK: Place Index リソース作成 (ジオコーディング用)
- [ ] 2.5.2 CDK: Lambda に Location Service 権限付与
- [ ] 2.5.3 Backend: ジオコーディングサービス作成 (住所→座標変換)
- [ ] 2.5.4 Backend: 管理API に住所ジオコーディング統合 (lat/lng手動入力を不要に)
- [ ] 2.5.5 Backend: 近隣検索を Location Service Places API に移行 (dynamodb-geo 置換)
- [ ] 2.5.6 Frontend: 管理画面の店舗登録を住所入力ベースに改修
- [ ] 2.5.7 Frontend: 住所オートコンプリート (SearchPlaceIndexForSuggestions)
- [ ] 2.5.8 ビルド検証 + 動作確認

## Phase 3: くじ管理
- [x] くじシリーズCRUD (admin API) - admin handler
- [x] 管理画面 (店舗管理者用) - /admin page
- [x] くじ一覧・詳細ページ (ユーザー用) - KujiCard component
- [x] ウォッチリスト機能 - /watchlist page + users handler

## Phase 4: 通知システム
- [x] LINE Messaging API連携 - notification handler
- [x] SQSキュー + 通知Lambda - notification-stack.ts
- [x] くじ入荷時のウォッチリストマッチング通知 - notification service
- [ ] Web Push Service Worker (frontend SW not yet created)
- [ ] SNS Platform Application (Web Push)

## Phase 5: 抽選予約
- [x] 予約エンドポイント (作成/キャンセル) - reservation handler
- [x] バリデーション (最大3回/人/くじ/店舗)
- [x] 予約UI - /reservations page + store detail reserve button
- [x] EventBridge日次スケジュール - scheduler-stack.ts
- [x] 抽選Lambda (ランダム選出、結果書込) - lottery service
- [x] 当選/落選通知 - lottery -> notification pipeline
- [x] 結果確認ページ - /reservations page with status

## Phase 6: 仕上げ
- [ ] エラーハンドリング、ローディング状態 (basic done, needs polish)
- [ ] モバイルUI最適化、PWAマニフェスト
- [ ] CloudWatchアラーム
- [ ] 負荷テスト
- [ ] セキュリティレビュー

## Remaining for MVP
- E2E verification requires AWS deployment
- Web Push Service Worker
- PWA manifest
- CloudWatch alarms
