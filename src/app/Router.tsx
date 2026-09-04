import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "../features/landing/pages/HomePage";
import NotFoundPage from "../shared/pages/NotFoundPage";
import Spinner from "../shared/components/Spinner";

// Everything private is loaded separately. Three or four people use it; there
// is no reason for every visitor of the restaurant to download the admin panel
// and the whole of supabase-js with it. That is why access control lives in
// auth/ProtectedRoutes and not here: if this module imported the session
// hooks, Supabase would go straight back into this chunk.
const LoginRoute = lazy(() =>
  import("../features/auth/components/ProtectedRoutes").then((m) => ({
    default: m.LoginRoute,
  })),
);
const AdminRoute = lazy(() =>
  import("../features/auth/components/ProtectedRoutes").then((m) => ({
    default: m.AdminRoute,
  })),
);
const DishesPage = lazy(() => import("../features/admin/pages/DishesPage"));
const NewDishPage = lazy(() => import("../features/admin/pages/NewDishPage"));
const EditDishPage = lazy(() => import("../features/admin/pages/EditDishPage"));
const CategoriesPage = lazy(
  () => import("../features/admin/pages/CategoriesPage"),
);
const TeamPage = lazy(() => import("../features/admin/pages/TeamPage"));

/**
 * The router, and everything only reachable through it.
 *
 * This module is loaded on demand, never on `/` — see app/App.tsx for why.
 * `HomePage` is still routed here because `/` is not the only way to arrive at
 * it: a `Link to="/"` from the 404 page navigates client side, and the route
 * has to exist for that navigation to land somewhere.
 */
function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/login" element={<LoginRoute />} />

          <Route path="/admins" element={<AdminRoute />}>
            <Route index element={<DishesPage />} />
            <Route path="platos/nuevo" element={<NewDishPage />} />
            <Route path="platos/:id" element={<EditDishPage />} />
            <Route path="categorias" element={<CategoriesPage />} />
            <Route path="equipo" element={<TeamPage />} />
            {/* /admins/anything lands here, inside the layout, instead of
                kicking the admin out of the panel. */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          {/* Rendered in place, without redirecting, to preserve the URL the
              user typed. */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default Router;
