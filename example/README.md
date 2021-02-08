This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## First deployment

```
$ terraform apply
```

## Application update

Set environments like below:
```
# You must replace values with your resource info from output of `terraform apply`
export AWS_DEFAULT_REGION=eu-west-1
export TFNEXT_STATIC_UPLOAD_BUCKET=tfnext-app-deploy-source-20210127061544072400000001
export TFNEXT_PROXY_CONFIG_BUCKET=next-tf-proxy-config20210127054511367700000001
export TFNEXT_LAMBDA_ROLE_ARN=arn:aws:iam::539425821792:role/tfnext-app-lambda-excution-role-76c6d201
export TFNEXT_APIGW_API_EXECUTION_ARN=arn:aws:execute-api:eu-west-1:539425821792:cofqxic3sg
export TFNEXT_APIGW_API_ID=cofqxic3sg
export TFNEXT_ROLE_ARN=arn:aws:iam::539425821792:role/tfnext-app-lambda-excution-role-76c6d201
export BRANCH_OR_TAG=master
```

```
$ yarn tfbuild
$ yarn deploy
```
