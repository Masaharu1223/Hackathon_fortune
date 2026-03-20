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

`SEED_REGION` を指定しない場合は `minami-machida` が使われます。

```sh
SEED_REGION=minami-machida npm run seed:dev
```
