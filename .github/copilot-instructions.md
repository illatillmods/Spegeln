- [x] Verify that the copilot-instructions.md file in the .github directory is created.
  File exists in `.github` and was kept up to date during setup.

- [x] Clarify Project Requirements
  The request specified a Swedish product, Swedish language, a modern web stack, monetization strategy and legal guardrails.

- [x] Scaffold the Project
  The official Next.js scaffolder was attempted first but failed because the workspace folder name contains an uppercase letter. The project was scaffolded manually in the current root with package name `spegeln`.

- [x] Customize the Project
  Added Swedish product pages, pricing, legal content, modern visual design, Prisma schema, Vercel/Railway deployment support, optional Docker fallback and project documentation.

- [x] Install Required Extensions
  No required extensions were provided by the project setup information.

- [x] Compile the Project
  Installed dependencies, resolved toolchain compatibility issues, and verified the app with `npm run lint` and `npm run build`.

- [x] Create and Run Task
  Created and started a VS Code task named `dev` that runs `npm run dev`.

- [x] Launch the Project
  A development server is running through the `dev` task. No separate debug launch configuration was created because none was requested.

- [x] Ensure Documentation is Complete
  Updated `README.md` with stack, monetization, legal considerations and hosted-first Vercel/Railway instructions. Removed all HTML comments from this file.

- Work through each checklist item systematically.
- Keep communication concise and focused.
- Follow development best practices.