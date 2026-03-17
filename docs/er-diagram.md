# ER図

## 論理ER図

```mermaid
erDiagram
    USER ||--o{ RESERVATION : "予約する"
    USER ||--o{ WATCHLIST_ITEM : "ウォッチする"
    USER ||--o{ LOTTERY_RESULT : "抽選結果"
    USER ||--o{ MY_STORE : "マイ店舗登録"
    USER ||--o{ NOTIFICATION : "通知を受け取る"

    STORE ||--o{ KUJI_SERIES : "取り扱う"
    STORE ||--o{ MY_STORE : "登録される"

    KUJI_SERIES ||--o{ PRIZE : "景品を含む"
    KUJI_SERIES ||--o{ RESERVATION : "予約対象"
    KUJI_SERIES ||--o{ WATCHLIST_ITEM : "ウォッチ対象"
    KUJI_SERIES ||--o{ LOTTERY_RESULT : "抽選対象"

    USER {
        string userId PK "Cognito sub"
        string displayName "表示名"
        string email "メールアドレス"
        string authProvider "google | line"
        string lineUserId "LINE UID (通知用)"
        json pushSubscription "Web Push購読情報"
        datetime createdAt
        datetime updatedAt
    }

    STORE {
        string storeId PK "UUID"
        string storeName "店舗名"
        string address "住所"
        float lat "緯度"
        float lng "経度"
        string managerId FK "管理者ユーザーID"
        datetime createdAt
        datetime updatedAt
    }

    KUJI_SERIES {
        string seriesId PK "UUID"
        string storeId FK "取扱店舗ID"
        string title "くじタイトル"
        date releaseDate "発売日"
        date endDate "終了日"
        int totalTickets "総枚数"
        int remainingTickets "残り枚数"
        string status "upcoming | on_sale | sold_out"
        datetime createdAt
        datetime updatedAt
    }

    PRIZE {
        string seriesId FK "所属シリーズ"
        string rank "A | B | C | D | E | ラスト"
        string name "景品名"
        int quantity "数量"
        string imageUrl "画像URL（任意）"
    }

    RESERVATION {
        string storeId FK
        string seriesId FK
        string userId FK
        int drawCount "引く回数 (1-3)"
        string status "pending | won | lost | cancelled"
        datetime createdAt
        datetime updatedAt
    }

    WATCHLIST_ITEM {
        string userId FK
        string seriesId FK
        string seriesTitle "くじタイトル（非正規化）"
        float notifyRadius "通知半径 (km)"
        float userLat "登録時の緯度"
        float userLng "登録時の経度"
        datetime createdAt
    }

    LOTTERY_RESULT {
        string storeId FK
        string seriesId FK
        string userId FK
        date date "抽選日"
        string result "won | lost"
        int drawsWon "当選回数"
    }

    MY_STORE {
        string userId FK
        string storeId FK
        datetime createdAt
    }

    NOTIFICATION {
        string notificationId PK
        string userId FK
        string storeId FK
        string seriesId FK
        string type "new_arrival | restock | lottery_result | watchlist_match"
        string title "通知タイトル"
        string message "通知本文"
        boolean isRead "既読フラグ"
        datetime createdAt
    }
```

## DynamoDB 物理テーブル設計

### メインテーブル (IchibanKujiTable)

```mermaid
flowchart LR
    subgraph MainTable["IchibanKujiTable (Single Table Design)"]
        direction TB

        subgraph UserItems["User アイテム群"]
            U1["PK: USER#userId\nSK: PROFILE\n→ displayName, authProvider, lineUserId..."]
            U2["PK: USER#userId\nSK: WATCH#seriesId\n→ seriesTitle, notifyRadius, userLat/Lng"]
            U3["PK: USER#userId\nSK: MYSTORE#storeId\n→ createdAt"]
        end

        subgraph StoreItems["Store アイテム群"]
            S1["PK: STORE#storeId\nSK: PROFILE\n→ storeName, address, lat, lng, managerId"]
            S2["PK: STORE#storeId\nSK: KUJI#seriesId\n→ title, remainingTickets, prizes[], status"]
        end

        subgraph ReservationItems["Reservation アイテム群"]
            R1["PK: STORE#storeId#KUJI#seriesId\nSK: RESERVATION#userId\n→ drawCount, status"]
            R2["PK: STORE#storeId#KUJI#seriesId\nSK: LOTTERY#date##userId\n→ result, drawsWon"]
        end

        subgraph NotificationItems["Notification アイテム群"]
            N1["PK: USER#userId\nSK: NOTIF#timestamp#notifId\n→ type, title, message, isRead"]
        end
    end
```

### GSI (グローバルセカンダリインデックス)

| GSI | PK | SK | 用途 |
|-----|----|----|------|
| GSI1 | `SERIES#{seriesId}` | `WATCH#{userId}` | シリーズ → ウォッチしているユーザー一覧 |
| GSI2 | `SERIES#{seriesId}` | `STORE#{storeId}` | シリーズ → 取扱店舗一覧 |
| GSI3 | `USER#{userId}` | `RESERVATION#{storeId}##seriesId` | ユーザー → 全予約一覧 |

### Geoテーブル (StoreGeoTable)

| Key | Type | 説明 |
|-----|------|------|
| hashKey | NUMBER | ジオハッシュ（dynamodb-geo-v3） |
| rangeKey | STRING | storeId |
| geoJson | STRING | `{"type":"Point","coordinates":[lng,lat]}` |
| storeName | STRING | 店舗名（非正規化） |
| address | STRING | 住所（非正規化） |
