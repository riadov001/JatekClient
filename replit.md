# Jatek Food Delivery Platform

Jatek is a full-stack food delivery application serving Oujda, Morocco, connecting customers, restaurants, drivers, and administrators.

## Run & Operate

- `pnpm run typecheck`: Full typecheck across all packages.
- `pnpm run build`: Typecheck and build all packages.
- `pnpm --filter @workspace/api-spec run codegen`: Regenerate API hooks and Zod schemas from OpenAPI spec.
- `pnpm --filter @workspace/db run push`: Push DB schema changes (development only).
- `pnpm --filter @workspace/api-server run dev`: Run the API server locally.

Required Environment Variables: `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` (for production admin seeding), `EXPO_PUBLIC_DOMAIN` (for mobile app production API), `EXPO_PUBLIC_GOOGLE_MAPS_KEY`, `EXPO_PUBLIC_GOOGLE_PLACES_KEY`.

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24
- **TypeScript**: 5.9
- **API**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API Codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend (Web)**: React, Vite, Tailwind, shadcn/ui, wouter, react-query
- **Frontend (Mobile)**: Expo (React Native)
- **Internationalization**: `i18next`

## Where things live

- `artifacts/api-server`: Express 5 REST API.
- `artifacts/jatek-mobile`: Expo (React Native) mobile app (customer-facing).
- `artifacts/backend-dashboard`: React + Vite admin dashboard.
- `lib/api-spec/openapi.yaml`: Source of truth for API specification.
- `lib/api-client-react`: Orval-generated API hooks and custom fetch client.
- `lib/api-zod`: Orval-generated Zod schemas for API validation.
- `lib/db`: Drizzle ORM schema and client.
- `artifacts/jatek-mobile/constants/colors.ts`: Mobile app brand color palette.
- `artifacts/api-server/src/routes/backend.ts`: Backend dashboard API routes.

## Architecture decisions

- **Monorepo Structure**: Uses pnpm workspaces to manage multiple applications (API, web, mobile, admin) and shared libraries within a single repository for streamlined development and dependency management.
- **API-First Design**: OpenAPI specification (`openapi.yaml`) is the single source of truth for the API, driving both frontend client generation (Orval) and backend implementation.
- **Role-Based Access Control (RBAC)**: Comprehensive RBAC implemented at the API level (via `backend.ts` routes) and enforced in frontend dashboards for `super_admin`, `admin`, `manager`, `restaurant_owner`, and `employee` roles.
- **Isolated Production Data**: Production environments are strictly isolated from development/test data, with seeding limited to essential core accounts (`ensureCoreAccounts()`) only.
- **Unified Brand Palette**: A consistent brand color palette is defined and maintained across web and mobile applications, ensuring a cohesive user experience.

## Product

Jatek offers a comprehensive food delivery experience with features like:

- **Multi-role Platform**: Supports customer, driver, restaurant owner, and admin roles.
- **Advanced Ordering**: Scheduled orders, contactless delivery, one-tap reorder.
- **Engagement & Retention**: Promo code engine, two-way ratings, in-app chat, notification center, referral & wallet system.
- **Rich Content**: Dietary tags on menu items, categories, ads, and short-form video content.
- **Localized Experience**: Full internationalization (English, French, Arabic) with RTL support and language persistence.
- **Mobile-First**: Dedicated Expo mobile application with live order tracking, map integration, and robust performance hardening.
- **Administrative Tools**: A dedicated backend dashboard for comprehensive management of orders, products, users, staff, promotions, and more.

## User preferences

- _Populate as you build_

## Gotchas

- Always run `pnpm run typecheck` and `pnpm run build` before committing to ensure all packages are consistent.
- Database schema changes require `pnpm --filter @workspace/db run push` in development.
- API client and Zod schemas need `pnpm --filter @workspace/api-spec run codegen` after any `openapi.yaml` modifications.
- Production builds (`scripts/build-production.sh`) serve the frontend applications directly from the API server.
- Seeding of demo/test data is strictly for development environments and never runs in production.
- **EAS Secrets (mobile)**: Before running `eas build --profile production` or `--profile preview`, make sure the following secrets are set in the EAS project dashboard (https://expo.dev) under **Secrets**: `EXPO_PUBLIC_GOOGLE_MAPS_KEY`, `EXPO_PUBLIC_GOOGLE_PLACES_KEY`. The `eas.json` build profiles reference them as `"$EXPO_PUBLIC_GOOGLE_MAPS_KEY"` etc. Without these, the production app silently falls back to Leaflet/OpenStreetMap instead of Google Maps.

## Pointers

- **pnpm workspaces**: Refer to the `pnpm-workspace` skill for details on monorepo structure and package management.
- **Drizzle ORM**: [https://orm.drizzle.team/](https://orm.drizzle.team/)
- **Orval**: [https://orval.dev/](https://orval.dev/)
- **Zod**: [https://zod.dev/](https://zod.dev/)
- **Express**: [https://expressjs.com/](https://expressjs.com/)
- **React Query**: [https://tanstack.com/query/latest](https://tanstack.com/query/latest)
- **i18next**: [https://www.i18next.com/](https://www.i18next.com/)
- **Expo**: [https://expo.dev/](https://expo.dev/)