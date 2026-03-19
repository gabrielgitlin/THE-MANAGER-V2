import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import SupabaseConnectionStatus from './components/SupabaseConnectionStatus';
import { useAuthStore } from './store/authStore';
import { isNative } from './lib/platform';

const Landing = React.lazy(() => import('./pages/Landing'));
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Catalog = React.lazy(() => import('./pages/Catalog'));
const CatalogList = React.lazy(() => import('./pages/CatalogList'));
const TrackDetails = React.lazy(() => import('./pages/TrackDetails'));
const AlbumDetails = React.lazy(() => import('./pages/AlbumDetails'));
const Finance = React.lazy(() => import('./pages/Finance'));
const FinanceDetails = React.lazy(() => import('./pages/FinanceDetails'));
const Movements = React.lazy(() => import('./pages/Movements'));
const Legal = React.lazy(() => import('./pages/Legal'));
const Live = React.lazy(() => import('./pages/Live'));
const Overview = React.lazy(() => import('./pages/live/Overview'));
const ShowDay = React.lazy(() => import('./pages/live/ShowDay'));
const AllShows = React.lazy(() => import('./pages/live/AllShows'));
const AllEvents = React.lazy(() => import('./pages/live/AllEvents'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const Marketing = React.lazy(() => import('./pages/Marketing'));
const LiveMarketing = React.lazy(() => import('./pages/live/marketing'));
const Production = React.lazy(() => import('./pages/live/production'));
const Logistics = React.lazy(() => import('./pages/live/Logistics'));
const ShowDetails = React.lazy(() => import('./pages/live/ShowDetails'));
const ShowFees = React.lazy(() => import('./pages/live/ShowFees'));
const Artist = React.lazy(() => import('./pages/Artist'));
const Team = React.lazy(() => import('./pages/Team'));
const Notes = React.lazy(() => import('./pages/Notes'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const Settings = React.lazy(() => import('./pages/Settings'));
const SharedPlaylist = React.lazy(() => import('./pages/SharedPlaylist'));

function AppRoutes() {
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={!user ? <Landing /> : <Navigate to="/dashboard" replace />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/playlist/:shareToken" element={<SharedPlaylist />} />
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="calendar" element={
            <ProtectedRoute requiredPermission="view_live">
              <Calendar />
            </ProtectedRoute>
          } />

          <Route path="catalog" element={
            <ProtectedRoute requiredPermission="view_catalog">
              <Catalog />
            </ProtectedRoute>
          } />
          <Route path="catalog/list" element={
            <ProtectedRoute requiredPermission="view_catalog">
              <CatalogList />
            </ProtectedRoute>
          } />
          <Route path="catalog/track/:id" element={
            <ProtectedRoute requiredPermission="view_catalog">
              <TrackDetails />
            </ProtectedRoute>
          } />
          <Route path="catalog/album/:id" element={
            <ProtectedRoute requiredPermission="view_catalog">
              <AlbumDetails />
            </ProtectedRoute>
          } />

          <Route path="finance" element={
            <ProtectedRoute requiredPermission="view_finance">
              <Finance />
            </ProtectedRoute>
          } />
          <Route path="finance/movements" element={
            <ProtectedRoute requiredPermission="view_finance">
              <Movements />
            </ProtectedRoute>
          } />
          <Route path="finance/:id" element={
            <ProtectedRoute requiredPermission="view_finance">
              <FinanceDetails />
            </ProtectedRoute>
          } />

          <Route path="legal" element={
            <ProtectedRoute requiredPermission="view_legal">
              <Legal />
            </ProtectedRoute>
          } />

          <Route path="live" element={
            <ProtectedRoute requiredPermission="view_live">
              <Live />
            </ProtectedRoute>
          }>
            <Route index element={<Overview />} />
            <Route path="shows" element={<AllShows />} />
            <Route path="events" element={<AllEvents />} />
            <Route path="showday" element={<ShowDay />} />
            <Route path="show/:id" element={<ShowDetails />} />
            <Route path="show/:id/logistics" element={<ShowDetails />} />
            <Route path="show/:id/marketing" element={<ShowDetails />} />
            <Route path="show/:id/production" element={<ShowDetails />} />
            <Route path="show/:id/setlist" element={<ShowDetails />} />
            <Route path="show/:id/guestlist" element={<ShowDetails />} />
            <Route path="marketing" element={<LiveMarketing />} />
            <Route path="logistics" element={<Logistics />} />
            <Route path="production" element={<Production />} />
            <Route path="fees" element={<ShowFees />} />
          </Route>

          <Route path="marketing" element={
            <ProtectedRoute requiredPermission="view_marketing">
              <Marketing />
            </ProtectedRoute>
          } />

          <Route path="team" element={
            <ProtectedRoute requiredPermission="view_personnel">
              <Team />
            </ProtectedRoute>
          } />

          <Route path="artist" element={
            <ProtectedRoute requiredPermission="view_sensitive_info">
              <Artist />
            </ProtectedRoute>
          } />

          <Route path="notes" element={
            <ProtectedRoute>
              <Notes />
            </ProtectedRoute>
          } />
          <Route path="tasks" element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      <SupabaseConnectionStatus />
    </Suspense>
  );
}

export default function App() {
  const Router = isNative ? MemoryRouter : BrowserRouter;
  const routerProps = isNative ? { initialEntries: ['/dashboard'] } : {};

  return (
    <Router {...routerProps}>
      <AppRoutes />
    </Router>
  );
}
