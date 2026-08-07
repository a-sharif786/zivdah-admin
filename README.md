# Zivdah Admin

Admin Portal + Vendor Portal for the Zivdah multi-vendor grocery platform, in a single React app, built against the real `zivdah-api` microservices (no invented endpoints).

## Stack

React 19 + Vite + TypeScript + Ant Design, React Router v7 (data router), TanStack Query, Axios, Zustand (+ persist), jwt-decode, dayjs.

## Setup

```bash
npm install
npm run dev      # http://localhost:5174
```

Configure the API Gateway base URL via `.env` (`VITE_API_BASE_URL`, defaults to `http://localhost:8001`). The backend (`../zivdah-api`) must be running — see its own README/docker-compose for bringing up Postgres, Redis, Kafka, Eureka, the gateway, and all services.

## Logging in

Log in with a user whose role is `ADMIN` or `VENDOR` (via the existing `/auth/login` endpoint — mobile or email + password). `USER`-role accounts are refused access to this app; there is no separate registration flow here, accounts are provisioned via the existing auth-service APIs (e.g. through the Postman collection or the customer app).

## Backend prerequisites

This frontend depends on a set of backend additions made alongside it (see `../zivdah-api`'s git history / the project plan for details):

- Every service's JWT filter now correctly extracts `userId`/`role` into Spring Security authorities (previously only auth/product/user services did this), so role-gated endpoints actually enforce roles.
- `Product` now carries a server-assigned `vendorId` (null = platform/ADMIN-owned).
- New admin "list all" endpoints: `GET /orders/all`, `GET /payments/all`, `GET /inventory`, `GET /notifications`.
- New vendor-scoped endpoints: `GET /products/vendor/{vendorId}`, `GET /orders/vendor/{vendorId}`, `GET /reviews/product/{productId}`.

If you run this against an older `zivdah-api` build without these changes, the Admin/Vendor-specific screens (Orders, Payments, Inventory, Notifications lists; vendor "My Products/Orders/Reviews") will 404 or 403.

## Known limitations (inherited from the backend, not this app)

- List endpoints return a bare array with no total count — pagination controls estimate "is there a next page" by over-fetching by one row rather than showing an exact total.
- Vendor order visibility is scoped by denormalizing `vendorId` onto order line items **at checkout time**, supplied by whichever client places the order. Orders created before this field existed, or by a client that doesn't populate it, won't show up under a vendor's "My Orders".
- Vendor Inventory/Reviews pages compose several per-product API calls client-side (there's no vendor-scoped bulk endpoint for either) — fine for a vendor with a modest catalog, not optimized for hundreds of products.

## Project layout

```
src/
  api/        one module per backend service, 1:1 with real endpoints
  types/      TypeScript mirrors of the backend DTOs/enums
  store/      zustand auth store (token, user, persisted)
  hooks/      usePagedQuery (size+1 pagination trick), useAuth
  components/
    guards/   ProtectedRoute, RoleRoute, RootRedirect
    layout/   AppLayout (Sider/Header/Content), nav config
    common/   StatusTag, PageHeader, ConfirmDeleteButton, ImageUploadField
    forms/    ProductForm, BannerForm, CouponForm (shared by both portals)
  pages/
    admin/    full-platform screens (Users, Products, Banners, Coupons, Orders, Payments, Inventory, Notifications, Reviews)
    vendor/   scoped-to-self screens (My Products, My Orders, My Inventory, My Reviews)
  router.tsx  route tree with role-based guards
```
