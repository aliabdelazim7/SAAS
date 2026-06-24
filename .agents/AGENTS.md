# Project-Scoped Rules (SAAS ERP Workspace)

## Automatic Deployment Rule
Whenever any code modifications are made to either the API (`apps/api`), database (`packages/database`), or web client (`apps/web`):
1. **Local Compilation & Verification**: Build and test the monorepo locally first using `pnpm build` to ensure no errors.
2. **Git Commit & Push**: Automatically stage, commit, and push the changes to `origin main` on GitHub.
3. **Trigger Deployments**:
   - For **Render** (API backend): Trigger a deploy using the Render API (using `RENDER_API_KEY` from environment variables) for service ID `srv-d8tfko0js32c73bmapf0`.
   - For **Vercel** (Frontend): Vercel will automatically build the changes on git push.
4. **No Explicit Ask Needed**: Run these deployment actions proactively without waiting for the user to request them.
