import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "../features/landing/pages/HomePage";
import NotFoundPage from "../shared/pages/NotFoundPage";
import ErrorBoundary from "../shared/components/ErrorBoundary";
import Spinner from "../shared/components/Spinner";

// The public landing page ships in the main chunk: it is what most people come
// for and it must not wait on an extra download.
//
// Everything private is loaded separately. Three or four people use it; there
// is no reason for every visitor of the restaurant to download the admin panel
// and the whole of supabase-js with it. That is why access control lives in
// auth/ProtectedRoutes and not here: if App imported the session hooks,
// Supabase would go straight back into the main chunk.
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

function App() {
  return (
    <BrowserRouter>
      {/* Inside the router so the boundary can still be rendered with routing
          context available, and outside <Routes> so it covers every page,
          including the lazy ones and their loading failures. */}
      <ErrorBoundary>
        {/* HomePage and NotFoundPage are not lazy, so `/` never suspends and this
          fallback is never painted there. */}
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
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
