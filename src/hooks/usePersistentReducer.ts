import { useEffect, useReducer } from 'react';

export function usePersistentReducer<State, Action>(
  reducer: (state: State, action: Action) => State,
  initialState: State,
  storageKey: string,
): [State, React.Dispatch<Action>] {
  const [state, dispatch] = useReducer(reducer, initialState, (fallback) => {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return fallback;
    }

    try {
      return JSON.parse(stored) as State;
    } catch {
      window.localStorage.removeItem(storageKey);
      return fallback;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  return [state, dispatch];
}
