import { useEffect, useState } from 'react';
import { AboutPage } from './components/about/AboutPage';
import { AnalysisPage } from './components/analysis/AnalysisPage';
import { StoreMap } from './components/dashboard/StoreMap';
import { getSkuSuggestions, normalizeSku } from './components/dashboard/storeMapCatalog';
import { AppShell } from './components/layout/AppShell';
import type { RouteId } from './routes';

function readRoute(): RouteId {
  const hash = window.location.hash.replace('#/', '');
  if (hash === 'about') return 'about';
  if (hash === 'analysis') return 'analysis';
  return 'dashboard';
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
  const [locatorQuery, setLocatorQuery] = useState('');
  const [selectedLocatorSku, setSelectedLocatorSku] = useState('');
  const locatorSuggestions = getSkuSuggestions(locatorQuery);

  const updateLocatorQuery = (query: string) => {
    setLocatorQuery(query);
    setSelectedLocatorSku('');
  };

  const submitLocatorQuery = () => {
    const trimmedQuery = locatorQuery.trim();
    const exactSuggestion = locatorSuggestions.find(
      (suggestion) => normalizeSku(suggestion.sku) === normalizeSku(trimmedQuery),
    );
    const selectedSuggestion =
      exactSuggestion ?? (locatorSuggestions.length === 1 ? locatorSuggestions[0] : null);
    const selectedSku = selectedSuggestion?.sku ?? trimmedQuery;

    setLocatorQuery(selectedSku);
    setSelectedLocatorSku(selectedSku);
  };

  const selectLocatorSuggestion = (sku: string) => {
    setLocatorQuery(sku);
    setSelectedLocatorSku(sku);
  };

  const clearLocatorQuery = () => {
    setLocatorQuery('');
    setSelectedLocatorSku('');
  };

  return (
    <AppShell
      locatorQuery={locatorQuery}
      locatorSuggestions={locatorSuggestions}
      route={route}
      onLocatorClear={clearLocatorQuery}
      onLocatorQueryChange={updateLocatorQuery}
      onLocatorSubmit={submitLocatorQuery}
      onLocatorSuggestionSelect={selectLocatorSuggestion}
      onRouteChange={setRoute}
    >
      {/* About is stateless — render on demand */}
      {route === 'about' && <AboutPage />}

      {/* Dashboard and Analysis stay mounted across tab switches so their
          state is preserved. Visibility toggled via the 'hidden' class. */}
      <div className={route === 'dashboard' ? '' : 'hidden'}>
        <StoreMap locatorQuery={locatorQuery} selectedLocatorSku={selectedLocatorSku} />
      </div>
      <div className={route === 'analysis' ? '' : 'hidden'}>
        <AnalysisPage />
      </div>
    </AppShell>
  );
}
