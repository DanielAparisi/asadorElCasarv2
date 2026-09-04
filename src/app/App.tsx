import { lazy, Suspense } from "react";
import HomePage from "../features/landing/pages/HomePage";
import ErrorBoundary from "../shared/components/ErrorBoundary";
import Spinner from "../shared/components/Spinner";

const Router = lazy(() => import("./Router"));

/**
 * `/` is served without a router at all.
 *
 * react-router-dom is 38 kB —14 kB gzipped— and the landing page has no use
 * for it: it is a single page with anchors, and the only thing the router adds
 * is the ability to reach `/login` and `/admins`. Those are three or four
 * people. Everyone else was downloading a routing library to read the prices.
 *
 * This is the same reasoning that keeps supabase-js out of the landing (see
 * features/menu/hooks/useMenu.ts), applied one level up.
 *
 * `window.location.pathname` and not a hook: the whole point is to decide
 * before anything router-shaped is imported, and this runs once at module
 * load. Nothing on `/` navigates client side, so it never goes stale — the
 * router's own routes take over for every other URL.
 *
 * ⚠️ The consequence is that no component rendered by the landing may use
 * `Link`, `useNavigate` or any other router hook: on `/` there is no
 * `BrowserRouter` above them and they throw. That is why shared/ui/Brand links
 * home with a plain anchor.
 */
const isLanding = window.location.pathname === "/";

function App() {
  return (
    // Outside the router, unlike before: the boundary now also has to cover
    // the router chunk itself failing to download. Its fallback never needed
    // routing context anyway — it reloads the page rather than navigating.
    <ErrorBoundary>
      {isLanding ? (
        <HomePage />
      ) : (
        <Suspense fallback={<Spinner />}>
          <Router />
        </Suspense>
      )}
    </ErrorBoundary>
  );
}

export default App;
