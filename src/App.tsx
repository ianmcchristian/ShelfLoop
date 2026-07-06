import { useEffect, useState } from 'react';
import { AboutPage } from './components/about/AboutPage';
import { StoreMap } from './components/dashboard/StoreMap';
import { getSkuSuggestions, normalizeSku } from './components/dashboard/storeMapCatalog';
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
      {route === 'about' ? (
        <AboutPage />
      ) : (
        <StoreMap locatorQuery={locatorQuery} selectedLocatorSku={selectedLocatorSku} />
      )}
    </AppShell>
  );
}
