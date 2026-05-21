import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "../components/auth/ProtectedRoute";
import PublicRoute from "../components/auth/PublicRoute";

const Home = lazy(() => import("../pages/Home/Home"));
const Login = lazy(() => import("../pages/Login/Login"));
const Register = lazy(() => import("../pages/Register/Register"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword/ForgotPassword"));
const Planets = lazy(() => import("../pages/Planets/Planets"));
const PlanetDetails = lazy(() => import("../pages/PlanetDetails/PlanetDetails"));
const Videos = lazy(() => import("../pages/Videos/Videos"));
const Quiz = lazy(() => import("../pages/Quiz/Quiz"));
const Store = lazy(() => import("../pages/Store/Store"));
const Game = lazy(() => import("../pages/Game/Game"));
const Mysteries = lazy(() => import("../pages/Mysteries/Mysteries"));
const Feedback = lazy(() => import("../pages/Feedback/Feedback"));
const Profile = lazy(() => import("../pages/Profile/Profile"));
const Privacy = lazy(() => import("../pages/Legal/Privacy"));
const Terms = lazy(() => import("../pages/Legal/Terms"));
const NotFound = lazy(() => import("../pages/NotFound/NotFound"));

function RouteLoader() {
  return (
    <div className="route-loader" role="status" aria-live="polite">
      <div className="route-loader-card">
        <span aria-hidden="true" />
        <strong>Carregando modulo estelar</strong>
        <small>Preparando a proxima orbita...</small>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />

        <Route path="/privacy" element={<Privacy />} />

        <Route path="/terms" element={<Terms />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/planets"
          element={
            <ProtectedRoute>
              <Planets />
            </ProtectedRoute>
          }
        />

        <Route
          path="/planets/:id"
          element={
            <ProtectedRoute>
              <PlanetDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/videos"
          element={
            <ProtectedRoute>
              <Videos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <Quiz />
            </ProtectedRoute>
          }
        />

        <Route
          path="/store"
          element={
            <ProtectedRoute>
              <Store />
            </ProtectedRoute>
          }
        />

        <Route
          path="/game"
          element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mysteries"
          element={
            <ProtectedRoute>
              <Mysteries />
            </ProtectedRoute>
          }
        />

        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <Feedback />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
