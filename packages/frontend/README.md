## AWS APIの設定
storeページ等からDynamoDB上の情報にアクセスできるようになる

### 1.ApiUrlを確認する

```shell
aws cloudformation describe-stacks \
  --stack-name dev-IchibanKuji-Api \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text
```
を叩き，デプロイ済みのAPIのApiUrlを取得する

### 2. ローカル環境に反映する
`<api_url>`には上で取得したリンクを作る

```shell
cd packages/frontend/
touch .env.local #もしまだなければ
echo 'NEXT_PUBLIC_API_BASE_URL=<api_url>' >> .env.local
```


## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
