import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, MemoryRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import Onboarding from './components/Onboarding';
import { useAuthStore } from './store/authStore';
import { useOnboarding } from './hooks/useOnboarding';
import { isNative } from './lib/platform';
import { ensurePersonalWorkspace } from './lib/workspaces';

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
const LegalDetails = React.lazy(() => import('./pages/LegalDetails'));
const Live = React.lazy(() => import('./pages/live/Live'));
const Tours = React.lazy(() => import('./pages/live/Tours'));
const TourDetails = React.lazy(() => import('./pages/live/TourDetails'));
const TourItinerary = React.lazy(() => import('./pages/live/TourItinerary'));
const AllShows = React.lazy(() => import('./pages/live/AllShows'));
const Venues = React.lazy(() => import('./pages/live/Venues'));
const VenueDetails = React.lazy(() => import('./pages/live/VenueDetails'));
const TourCalendar = React.lazy(() => import('./pages/live/TourCalendar'));
const ShowDay = React.lazy(() => import('./pages/live/ShowDay'));
const AllEvents = React.lazy(() => import('./pages/live/AllEvents'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const Marketing = React.lazy(() => import('./pages/Marketing'));
const LiveMarketing = React.lazy(() => import('./pages/live/marketing'));
const Production = React.lazy(() => import('./pages/live/production'));
const Logistics = React.lazy(() => import('./pages/live/Logistics'));
const ShowDetails = React.lazy(() => import('./pages/live/ShowDetails'));
const ShowFees = React.lazy(() => import('./pages/live/ShowFees'));
const Artist = React.lazy(() => import('./pages/Artist'));
const Industry = React.lazy(() => import('./pages/Industry'));
const ContactProfile = React.lazy(() => import('./pages/ContactProfile'));
const OrganizationProfile = React.lazy(() => import('./pages/OrganizationProfile'));
const ProjectProfile = React.lazy(() => import('./pages/ProjectProfile'));
const Notes = React.lazy(() => import('./pages/Notes'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const Settings = React.lazy(() => import('./pages/Settings'));
const SharedPlaylist = React.lazy(() => import('./pages/SharedPlaylist'));
const Sign = React.lazy(() => import('./pages/Sign'));
const DesignSystem = React.lazy(() => import('./pages/DesignSystem'));

function RedirectTeamToIndustry() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/industry/people/${id}`} replace />;
}

function AppRoutes() {
  const { user, loading, initialize } = useAuthStore();
  const { needsOnboarding, loading: onboardingLoading, currentStep, stepsCompleted, refresh } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Fire-and-forget: ensure a personal workspace exists whenever a user signs in.
  useEffect(() => {
    if (user) {
      ensurePersonalWorkspace().catch((err) =>
        console.error('[workspaces] ensurePersonalWorkspace failed:', err)
      );
    }
  }, [user]);

  // Show onboarding when detected
  useEffect(() => {
    if (!onboardingLoading && needsOnboarding && user) {
      setShowOnboarding(true);
    }
  }, [needsOnboarding, onboardingLoading, user]);

  if (loading || (user && onboardingLoading)) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {/* Onboarding overlay */}
      {showOnboarding && user && (
        <Onboarding
          initialStep={currentStep}
          stepsCompleted={stepsCompleted}
          onComplete={() => {
            setShowOnboarding(false);
            refresh();
          }}
        />
      )}

      <Routes>
        <Route path="/" element={!user ? <Landing /> : <Navigate to="/dashboard" replace />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/playlist/:shareToken" element={<SharedPlaylist />} />
        <Route path="/sign/:accessToken" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Sign />
          </Suspense>
        } />
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
          <Route path="legal/:id" element={
            <ProtectedRoute requiredPermission="view_legal">
              <LegalDetails />
            </ProtectedRoute>
          } />

          <Route path="live" element={
            <ProtectedRoute requiredPermission="view_live">
              <Live />
            </ProtectedRoute>
          }>
            <Route index element={<Tours />} />
            <Route path="shows" element={<AllShows />} />
            <Route path="venues" element={<Venues />} />
            <Route path="calendar" element={<TourCalendar />} />
            <Route path="tour/:tourId" element={<TourDetails />} />
            <Route path="tour/:tourId/itinerary" element={<TourItinerary />} />
            <Route path="venue/:venueId" element={<VenueDetails />} />
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

          <Route path="industry" element={
            <ProtectedRoute requiredPermission="view_personnel">
              <Industry />
            </ProtectedRoute>
          } />
          <Route path="industry/people/:id" element={
            <ProtectedRoute requiredPermission="view_personnel">
              <ContactProfile />
            </ProtectedRoute>
          } />
          <Route path="industry/companies/:id" element={
            <ProtectedRoute requiredPermission="view_personnel">
              <OrganizationProfile />
            </ProtectedRoute>
          } />
          <Route path="industry/projects/:id" element={
            <ProtectedRoute requiredPermission="view_personnel">
              <ProjectProfile />
            </ProtectedRoute>
          } />
          {/* Redirect legacy /team URLs */}
          <Route path="team" element={<Navigate to="/industry" replace />} />
          <Route path="team/:id" element={<RedirectTeamToIndustry />} />

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
          <Route path="design-system" element={
            <ProtectedRoute>
              <DesignSystem />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
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
