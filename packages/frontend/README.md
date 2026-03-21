## AWS API / Cognito の設定

store ページやログイン機能から AWS 上の API / Cognito を使うために、
`packages/frontend/.env.local` を設定する。

`AuthStack` の deploy 時には Google OAuth の credentials も必要になる。

### 1. Auth / Api stack を deploy する

`<admin_email>` は管理画面に入る Google アカウント、
`<google_client_id>` と `<google_client_secret>` は Google Cloud Console の OAuth client の値を入れる。

```shell
cd infra
GOOGLE_CLIENT_ID=<google_client_id> \
GOOGLE_CLIENT_SECRET=<google_client_secret> \
ADMIN_EMAIL_ALLOWLIST=<admin_email> \
npm run deploy -- \
  --context stage=dev \
  --context frontendBaseUrl=http://localhost:3000
```

### 2. CloudFormation Outputs を確認する

API URL を取得する。

```shell
aws cloudformation describe-stacks \
  --stack-name dev-IchibanKuji-Api \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text
```

Cognito Domain を取得する。

```shell
aws cloudformation describe-stacks \
  --stack-name dev-IchibanKuji-Auth \
  --query "Stacks[0].Outputs[?OutputKey=='CognitoDomainUrl'].OutputValue" \
  --output text
```

Client ID を取得する。

```shell
aws cloudformation describe-stacks \
  --stack-name dev-IchibanKuji-Auth \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" \
  --output text
```

### 3. `.env.local` を作成する

`<api_url>` には API stack の `ApiUrl`、`<cognito_domain>` には Auth stack の `CognitoDomainUrl`、
`<client_id>` には Auth stack の `UserPoolClientId` を入れる。

```shell
cd packages/frontend/
touch .env.local # もしまだなければ
cat <<EOF > .env.local
NEXT_PUBLIC_API_BASE_URL=<api_url>api/v1
NEXT_PUBLIC_COGNITO_DOMAIN=<cognito_domain>
NEXT_PUBLIC_CLIENT_ID=<client_id>
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/login/callback
NEXT_PUBLIC_LOGOUT_URI=http://localhost:3000/
EOF
```

### 4. 注意

Google OAuth 側の redirect URI には次を登録する。

```text
https://<cognito_domain_without_scheme>/oauth2/idpresponse
```

例:

```text
https://example.auth.ap-northeast-1.amazoncognito.com/oauth2/idpresponse
```

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
