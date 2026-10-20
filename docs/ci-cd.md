# CI/CD

The GitHub Actions workflow at `.github/workflows/ci-cd.yml` checks changes and deploys this Next.js app to Vercel.

## What runs

- Pull requests targeting `main`: frozen pnpm install, ESLint, and Next.js build. Vercel's Git integration creates the Preview deployment.
- Pushes to `main`: the same checks, then a Vercel Production deployment.
- Pull requests from forks still run validation, but do not receive Vercel credentials.

The production deployment uses the prebuilt output created in GitHub Actions. `vercel.json` disables Git integration deployments for `main` to prevent a duplicate production deployment; PR Preview deployments remain enabled. The Vercel token is only available to the protected-branch production job.

## GitHub configuration

In the repository's **Settings → Secrets and variables → Actions**, add these repository variables:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | The Supabase URL used by the deployed app. It must be reachable by users' browsers. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The public anon or publishable key used by the browser client. |

Add these repository secrets:

| Secret | Value |
| --- | --- |
| `VERCEL_TOKEN` | A Vercel access token for the project. |
| `VERCEL_ORG_ID` | The Vercel team or account ID. |
| `VERCEL_PROJECT_ID` | The Vercel project ID for this app. |

To find the Vercel IDs, link this app directory with `vercel link` and read `orgId` and `projectId` from the ignored `.vercel/project.json`. Do not commit that file or put the Vercel token in the repository.

Keep the app's server-only Supabase keys, email credentials, and other runtime secrets in the Vercel project's Preview and Production environment variables. The workflow pulls the appropriate environment before its Vercel build.

Connect this repository to the Vercel project with its Git integration enabled for Preview deployments. Set the Vercel Production Branch to `main`; the repo config disables Vercel's Git-triggered production deployment because GitHub Actions deploys production after checks pass.

After the workflow has run once, protect `main` in GitHub and require the **Lint and build** check before merging. This ensures production changes can only reach `main` after validation.

For Vercel's supported CLI build and prebuilt deployment commands, see [Vercel CLI build](https://vercel.com/docs/cli/build), [Vercel CLI deploy](https://vercel.com/docs/cli/deploy), and [Vercel CLI pull](https://vercel.com/docs/cli/pull).
