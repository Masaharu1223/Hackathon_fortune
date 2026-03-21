# Seed Scripts

`seed-dev-data.ts` は DynamoDB のメインテーブルと Geo テーブルに開発用データを投入します。

## 使い方

### 1. テーブル名を確認

```sh
aws cloudformation describe-stacks \
  --stack-name dev-IchibanKuji-Database \
  --query "Stacks[0].Outputs[?OutputKey=='MainTableName' || OutputKey=='GeoTableName'].[OutputKey,OutputValue]" \
  --output text
```

### 2. `packages/backend/.env.local` を用意

`.env.local` に以下を配置します。

```sh
TABLE_NAME=<MainTableName>
GEO_TABLE_NAME=<GeoTableName>
AWS_REGION=us-east-1
```

seed 実行時に `packages/backend/.env.local` を自動で読み込みます。

```sh
npm run seed:dev
```

`SEED_REGION` を指定しない場合は `meguro-station` が使われます。

```sh
SEED_REGION=meguro-station npm run seed:dev
```

## 既存店舗の `storeBrand` backfill

既存の `STORE#... / PROFILE` レコードを走査して、`storeName` から `storeBrand` を埋めます。

- `ローソン` / `lawson` -> `lawson`
- `ファミリーマート` / `ファミマ` / `familymart` -> `familymart`
- `セブン` / `7-eleven` / `seven-eleven` -> `seven-eleven`
- それ以外 -> `other`

`other` はフロント側で既存ロゴ (`/shop_logo.png`) に割り当てられます。

まず dry-run で確認:

```sh
npm run backfill:store-brands -w packages/backend -- --dry-run
```

問題なければ書き込み実行:

```sh
npm run backfill:store-brands -w packages/backend
```

既存の `storeBrand` も店舗名ベースで上書きしたい場合:

```sh
npm run backfill:store-brands -w packages/backend -- --force
```
