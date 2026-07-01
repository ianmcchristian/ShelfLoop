import { useEffect, useState } from 'react';
import { AboutPage } from './components/about/AboutPage';
import { StoreMap } from './components/dashboard/StoreMap';
import { AppShell } from './components/layout/AppShell';
import type { RouteId } from './routes';

function readRoute(): RouteId {
  return window.location.hash.replace('#/', '') === 'about' ? 'about' : 'dashboard';
}

function useHashRoute(): [RouteId, (route: RouteId) => void] {
  const [route, setRouteState] = useState<RouteId>(readRoute);

  useEffect(() => {
    const listener = () => setRouteState(readRoute());
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);

  const setRoute = (nextRoute: RouteId) => {
    window.location.hash = `/${nextRoute}`;
    setRouteState(nextRoute);
  };

  return [route, setRoute];
}

export default function App() {
  const [route, setRoute] = useHashRoute();

  return (
    <AppShell route={route} onRouteChange={setRoute}>
      {route === 'about' ? <AboutPage /> : <StoreMap />}
    </AppShell>
  );
}
