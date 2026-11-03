# アーキテクチャ（C4 モデル）

一番くじの店舗検索・予約アプリの構成を、C4 モデルの Level 1〜3 で示します。Level 4（コード）は、データモデルとして Main テーブルのキー設計だけを載せています。

基準コミット: `d047380`（main）。インフラの正は `infra/lib/stacks/`、コードの正は `packages/` です。

## Level 1: システムコンテキスト

```mermaid
flowchart TB
    user["👤 一般ユーザー<br/>近くの店舗のくじを探し、<br/>ウォッチ・予約する"]
    admin["👤 店舗管理者<br/>店舗・くじシリーズ・在庫を登録する"]

    system["一番くじ検索・予約システム<br/>店舗検索・予約・抽選・通知"]

    line["LINE Messaging API<br/>Push メッセージを配信"]
    loc["Amazon Location Service<br/>住所の検索と候補表示"]
    idp["Google / LINE ログイン（Cognito）<br/>※現在は無効化"]

    user -->|"くじを探す・予約する (HTTPS)"| system
    admin -->|"店舗・くじを登録する (HTTPS)"| system
    system -->|"抽選結果を送る"| line
    line -.->|"通知を届ける"| user
    system -->|"住所→緯度経度"| loc
    system -.->|"OAuth 認証（未接続）"| idp
```

## Level 2: コンテナ

```mermaid
flowchart TB
    user["👤 一般ユーザー"]
    admin["👤 店舗管理者"]

    subgraph sys["一番くじ検索・予約システム（AWS ap-northeast-1 / CDK）"]
        web["Web アプリ<br/>Next.js 16 静的出力<br/>利用者画面 + /admin"]
        cdn["CDN<br/>CloudFront"]
        s3[("静的ホスティング<br/>S3（非公開・OAC）")]
        api["REST API<br/>API Gateway + Lambda ×4"]
        batch["抽選バッチ<br/>EventBridge + Lambda<br/>毎日 JST 10:00"]
        queue["通知キュー<br/>SQS + DLQ"]
        worker["通知ワーカー<br/>Lambda（SQS トリガー）"]
        main[("Main テーブル<br/>DynamoDB 単一テーブル")]
        geo[("Geo テーブル<br/>DynamoDB / geo-v3")]
    end

    loc["Amazon Location Service"]
    line["LINE Messaging API"]

    user --> web
    admin -->|"/admin"| web
    web -->|HTTPS| cdn
    cdn -->|"/*"| s3
    cdn -->|"/api/*"| api
    api -->|"読み書き"| main
    api -->|"近隣店舗の検索"| geo
    api -->|"ジオコーディング"| loc
    batch -->|"抽選・残数の更新"| main
    batch -->|"結果を投入"| queue
    queue -->|"起動"| worker
    worker -->|"ユーザー情報を参照"| main
    worker -->|"Push"| line
```

| コンテナ | 技術 | 役割 | 定義場所 |
|---|---|---|---|
| Web アプリ | Next.js 16 / React 19 / Tailwind 4 / Leaflet | 店舗地図、くじ一覧、ウォッチリスト、予約、マイページ、管理画面。`output: 'export'` で静的出力 | `packages/frontend` |
| CDN | CloudFront + CloudFront Function | `/*` は S3、`/api/*` は API Gateway へ振り分け。`/path` を `/path/index.html` に書き換え | `infra/lib/stacks/frontend-stack.ts` |
| REST API | API Gateway + Lambda ×4（Node.js 20） | `/api/v1` 配下。Users / Stores / Reservation / Admin | `infra/lib/stacks/api-stack.ts` |
| 抽選バッチ | EventBridge（cron UTC 01:00）+ Lambda | 予約者の抽選、残数の更新、結果を通知キューへ投入 | `infra/lib/stacks/scheduler-stack.ts` |
| 通知キュー / ワーカー | SQS + DLQ（3回失敗で退避）/ Lambda | 通知を非同期に処理し、LINE Push を送信 | `infra/lib/stacks/notification-stack.ts` |
| Main テーブル | DynamoDB（GSI1〜3） | ユーザー、店舗、くじ、予約、ウォッチリスト、抽選結果 | `infra/lib/stacks/database-stack.ts` |
| Geo テーブル | DynamoDB + dynamodb-geo-v3 | 店舗の緯度経度をジオハッシュで保存し、半径検索に使う | `infra/lib/stacks/database-stack.ts` |

## Level 3: コンポーネント（バックエンド）

`packages/backend/src` の構成です。Lambda ハンドラーが HTTP やイベントを受け、サービスモジュールが AWS SDK を包んでいます。型と定数は `packages/shared` にあり、フロントとバックエンドの両方が使います。

```mermaid
flowchart TB
    subgraph handlers["handlers/（Lambda ハンドラー）"]
        h_admin["admin.ts<br/>店舗・くじ登録、住所検索"]
        h_stores["stores.ts<br/>近隣検索・店舗詳細"]
        h_users["users.ts<br/>プロフィール、ウォッチ・予約一覧"]
        h_resv["reservation.ts<br/>予約・キャンセル"]
        h_lot["lottery.ts<br/>EventBridge から起動"]
        h_noti["notification.ts<br/>SQS から起動"]
    end

    subgraph services["services/"]
        s_ddb["dynamodb.ts<br/>キー生成と CRUD"]
        s_geo["geo.ts<br/>putStore / queryNearby"]
        s_loc["location.ts<br/>ジオコーディング"]
        s_lot["lottery.ts<br/>runLottery()"]
        s_noti["notification.ts<br/>SQS へ送信"]
    end

    main[("Main テーブル")]
    geo[("Geo テーブル")]
    loc["Amazon Location"]
    queue["通知キュー（SQS）"]
    line["LINE Messaging API"]

    h_admin --> s_ddb
    h_admin --> s_geo
    h_admin --> s_loc
    h_stores --> s_ddb
    h_stores --> s_geo
    h_users --> s_ddb
    h_resv --> s_ddb
    h_lot --> s_lot
    s_lot --> s_ddb
    s_lot --> s_noti
    h_noti --> s_ddb
    h_noti --> line

    s_ddb --> main
    s_geo --> geo
    s_loc --> loc
    s_noti --> queue
    queue -->|"トリガー"| h_noti
```

| ハンドラー | エンドポイント / 処理 |
|---|---|
| `users.ts` | `GET /users/me`、ウォッチリストの `GET / POST / DELETE`、`GET /users/me/reservations` |
| `stores.ts` | `GET /stores/nearby?lat&lng&radius`、`GET /stores/{storeId}` |
| `reservation.ts` | `POST / DELETE /stores/{storeId}/kuji/{seriesId}/reserve` |
| `admin.ts` | 店舗とくじの登録・更新、予約者一覧、`POST /admin/geocode`、`GET /admin/suggest` |
| `lottery.ts` | 毎日 JST 10:00 に `runLottery()` を実行 |
| `notification.ts` | `watchlist_match` / `lottery_result` メッセージを処理し、LINE Push を送信 |

## Level 4: データモデル（Main テーブルのキー設計）

PK / SK と3つの GSI を持つシングルテーブル設計です。キーは `services/dynamodb.ts` の `keys` で生成します。

| エンティティ | PK | SK | GSI（用途） |
|---|---|---|---|
| ユーザー | `USER#{userId}` | `PROFILE` | なし |
| ウォッチリスト | `USER#{userId}` | `WATCH#{seriesId}` | GSI1 `SERIES#{seriesId}` / `WATCH#{userId}`：シリーズをウォッチしている人の一覧 |
| 店舗 | `STORE#{storeId}` | `PROFILE` | なし（位置は Geo テーブル） |
| くじシリーズ | `STORE#{storeId}` | `KUJI#{seriesId}` | GSI2 `SERIES#{seriesId}` / `STORE#{storeId}`：シリーズを扱う店舗の一覧 |
| 予約 | `STORE#{storeId}#KUJI#{seriesId}` | `RESERVATION#{userId}` | GSI3 `USER#{userId}` / `RESERVATION#{storeId}#{seriesId}`：自分の予約一覧 |
| 抽選結果 | `STORE#{storeId}#KUJI#{seriesId}` | `LOTTERY#{date}#{userId}` | なし |

## 現状の注意点

- **認証が無効**: Cognito（Google / LINE ログイン）の `AuthStack` は `infra/bin/app.ts` でコメントアウトされています。API は全エンドポイントが認証なしの公開状態で、開発用に `x-dev-user-id` ヘッダーで利用者を切り替えています。
- **Web Push は未実装**: 通知ワーカーで実際に送れるのは LINE Push だけです。
- **API の SQS 権限が未使用**: API の Lambda には通知キューへの送信権限がありますが、今のコードで通知を送っているのは抽選処理だけです。`watchlist_match` を送る処理は見当たりません。
- **フロントにモックが残っている**: `mockData.ts` と `mockNotifications.ts` があり、一部の画面は API ではなくモックデータで表示しています。`app/api.disabled/` は静的出力への切り替えで無効になっています。

## 関連ドキュメント

- [シーケンス図](./sequence-diagrams.md)
- [画面遷移図](./screen-transition.md)
