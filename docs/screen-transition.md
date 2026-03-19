# 画面遷移図

```mermaid
flowchart TD
    subgraph Public["パブリック（認証不要）"]
        HOME["/ トップページ\n在庫検索 + 地図表示"]
        LOGIN["/login ログイン\nGoogle / LINE OAuth"]
        CALLBACK["/login/callback\nOAuth コールバック"]
        DETAIL["/stores/detail?id=xxx\n店舗詳細 + くじ一覧"]
    end

    subgraph Protected["要認証"]
        NOTIFICATIONS["/notifications\nお知らせ（入荷通知）"]
        RESERVATIONS["/reservations\n予約一覧 + 抽選結果"]
        WATCHLIST["/watchlist\nウォッチリスト"]
        MYPAGE["/mypage\nマイページ"]
    end

    subgraph Future["今後実装"]
        KUJI["/kuji\nくじ情報一覧"]
        TRADE["/trade\n景品トレード"]
    end

    subgraph Admin["管理者"]
        ADMIN["/admin\n店舗登録 / くじ登録 / 予約管理"]
    end

    %% === ナビゲーション ===

    %% ログインフロー
    LOGIN -- "Google/LINE選択" --> COGNITO((Cognito\nOAuth))
    COGNITO -- "リダイレクト" --> CALLBACK
    CALLBACK -- "トークン保存" --> HOME

    %% トップページから
    HOME -- "マーカータップ" --> POPUP{{"ポップアップ\n店舗名 / 残数 / 詳細を見る / マイ店舗ボタン"}}
    POPUP -- "詳細を見る" --> DETAIL
    HOME -- "ベルアイコン" --> NOTIFICATIONS
    HOME -- "ユーザーアイコン" --> MYPAGE

    %% 店舗詳細から
    DETAIL -- "購入権利を予約" --> RESERVE_MODAL{{"予約ダイアログ\n引く回数: 1〜3"}}
    RESERVE_MODAL -- "確定" --> RESERVATIONS
    DETAIL -- "ウォッチリスト追加" --> WATCHLIST

    %% お知らせから
    NOTIFICATIONS -- "通知タップ" --> DETAIL

    %% 予約一覧から
    RESERVATIONS -- "店舗名タップ" --> DETAIL

    %% ウォッチリストから
    WATCHLIST -- "くじタイトルタップ" --> DETAIL

    %% ボトムナビ（常時表示）
    BOTTOM_NAV["BottomNav"]
    BOTTOM_NAV -. "在庫検索" .-> HOME
    BOTTOM_NAV -. "一番くじ" .-> KUJI
    BOTTOM_NAV -. "景品トレード" .-> TRADE

    %% 未認証時のリダイレクト
    Protected -- "未認証" --> LOGIN

    %% スタイル
    style Public fill:#e0f2fe,stroke:#0284c7
    style Protected fill:#fef3c7,stroke:#d97706
    style Future fill:#f3f4f6,stroke:#9ca3af
    style Admin fill:#fce7f3,stroke:#db2777
```

## 画面一覧

| 画面 | パス | 認証 | 主な機能 |
|------|------|------|---------|
| トップ（検索） | `/` | 不要 | 景品名検索、地図上に店舗マーカー表示、マイ店舗登録 |
| ログイン | `/login` | 不要 | Google / LINE OAuth ログイン |
| OAuthコールバック | `/login/callback` | 不要 | トークン取得・保存後リダイレクト |
| 店舗詳細 | `/stores/detail?id=xxx` | 不要（予約時ログイン） | くじ一覧、残数、予約ボタン、ウォッチリスト追加 |
| お知らせ | `/notifications` | 必要 | マイ店舗の入荷通知・在庫復活通知 |
| 予約一覧 | `/reservations` | 必要 | 予約状況、抽選結果（当選/落選） |
| ウォッチリスト | `/watchlist` | 必要 | 気になるくじの通知設定（半径指定） |
| マイページ | `/mypage` | 必要 | プロフィール、マイ店舗管理 |
| くじ情報 | `/kuji` | 不要 | くじ一覧・検索（今後実装） |
| 景品トレード | `/trade` | 必要 | 景品交換マッチング（今後実装） |
| 管理画面 | `/admin` | 必要(管理者) | 店舗登録、くじ登録、予約管理 |
