
## Getting Started

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Set `NEXTAUTH_SECRET` in your environment. The admin password is stored in AWS
Secrets Manager. Provide the secret name via `ADMIN_PASSWORD_SECRET_NAME` and
ensure your AWS credentials allow reading that secret.

Ensure your AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and
`AWS_REGION`) are configured so the app can access DynamoDB and Secrets Manager.
