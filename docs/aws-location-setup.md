# AWS Location Service セットアップガイド

## 概要
このガイドでは、OpenStreetMapからAWS Location Serviceへの移行手順を説明します。

## 前提条件
- AWS CLIがインストールされ、設定されていること
- Node.js 18以上がインストールされていること
- AWS CDKがインストールされていること (`npm install -g aws-cdk`)

## 手順

### 1. 依存関係のインストール

```bash
cd packages/frontend
npm install
```

### 2. AWS Location Stackのデプロイ

```bash
cd infra
npm install
cdk deploy dev-IchibanKuji-Location
```

デプロイが完了すると、以下の出力が表示されます:
- `MapName`: 地図リソースの名前
- `PlaceIndexName`: Place Indexの名前
- `IdentityPoolId`: Cognito Identity PoolのID
- `Region`: AWSリージョン

### 3. 環境変数の設定

デプロイ後、出力された値を使用して `.env.local` ファイルを作成します:

```bash
cd packages/frontend
cp .env.local.example .env.local
```

`.env.local` を編集し、以下の値を設定:

```env
NEXT_PUBLIC_AWS_REGION=ap-northeast-1
NEXT_PUBLIC_AWS_LOCATION_MAP_NAME=dev-IchibanKuji-Location-Map
NEXT_PUBLIC_AWS_IDENTITY_POOL_ID=<デプロイ時に出力されたIdentityPoolId>
```

### 4. フロントエンドの起動

```bash
cd packages/frontend
npm run dev
```

ブラウザで `http://localhost:3000` を開き、地図が表示されることを確認します。

## トラブルシューティング

### 地図が表示されない場合

1. **ブラウザのコンソールを確認**
   - 認証エラーが出ている場合、Identity Pool IDが正しく設定されているか確認
   - ネットワークエラーが出ている場合、IAMロールの権限を確認

2. **IAMロールの権限を確認**
   ```bash
   aws iam get-role --role-name <UnauthRoleの名前>
   ```

3. **地図リソースが正しくデプロイされているか確認**
   ```bash
   aws location describe-map --map-name dev-IchibanKuji-Location-Map
   ```

### 認証情報が取得できない場合

Amplifyの設定が正しく初期化されているか確認:
- `NEXT_PUBLIC_AWS_IDENTITY_POOL_ID` が設定されているか
- ブラウザのローカルストレージをクリアして再試行

## 地図スタイルの変更

デフォルトでは `VectorEsriNavigation` スタイルを使用していますが、以下のスタイルに変更可能:

- `VectorEsriStreets`
- `VectorEsriTopographic`
- `VectorEsriDarkGrayCanvas`
- `VectorEsriLightGrayCanvas`

変更する場合は、`infra/lib/stacks/location-stack.ts` の以下の部分を編集:

```typescript
this.map = new location.CfnMap(this, "Map", {
  mapName: `${id}-Map`,
  configuration: {
    style: "VectorEsriNavigation", // ← ここを変更
  },
  description: "一番くじアプリ: 地図表示用",
});
```

## コスト

AWS Location Serviceの料金:
- 地図タイルリクエスト: 1,000リクエストあたり $0.04
- 無料利用枠: 月間50,000リクエストまで無料（12ヶ月間）

詳細: https://aws.amazon.com/location/pricing/

## 参考リンク

- [AWS Location Service ドキュメント](https://docs.aws.amazon.com/location/)
- [MapLibre GL JS ドキュメント](https://maplibre.org/maplibre-gl-js/docs/)
- [AWS Amplify ドキュメント](https://docs.amplify.aws/)
