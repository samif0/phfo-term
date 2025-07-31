
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

## Environment Variables

Set `AWS_REGION` and either `ADMIN_PASSWORD_SECRET_NAME` or
`ADMIN_PASSWORD_SECRET_KEY` to the name of the AWS Secrets Manager secret
containing your admin credentials. The secret JSON must include an
`ADMIN_PASSWORD` field.


