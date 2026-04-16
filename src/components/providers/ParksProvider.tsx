"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

type ParksContextValue = {
  visitedParkIds: string[];
  wishlistParkIds: string[];
  isStorageReady: boolean;
  addToVisited: (parkId: string) => void;
  removeFromVisited: (parkId: string) => void;
  addToWishlist: (parkId: string) => void;
  removeFromWishlist: (parkId: string) => void;
  isVisited: (parkId: string) => boolean;
  isInWishlist: (parkId: string) => boolean;
};

type ParksState = {
  visitedParkIds: string[];
  wishlistParkIds: string[];
};

type StoredParksState = ParksState & {
  version: 1;
};

type ParksAction =
  | { type: "hydrate"; state: ParksState }
  | { type: "addVisited"; parkId: string }
  | { type: "removeVisited"; parkId: string }
  | { type: "addWishlist"; parkId: string }
  | { type: "removeWishlist"; parkId: string };

const PARKS_STORAGE_KEY = "journy.parksState";
const VISITED_STORAGE_KEY = "journy.visitedParkIds";
const WISHLIST_STORAGE_KEY = "journy.wishlistParkIds";
const LEGACY_VISITED_STORAGE_KEY = "journy.visitedParks";
const LEGACY_WISHLIST_STORAGE_KEY = "journy.wishlistParks";
const INITIAL_PARKS_STATE: ParksState = {
  visitedParkIds: [],
  wishlistParkIds: [],
};

const ParksContext = createContext<ParksContextValue | null>(null);

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids.filter((id) => id.trim().length > 0)));
}

function parseStoredIds(rawValue: string | null): string[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return uniqueIds(parsedValue.filter((id): id is string => typeof id === "string"));
  } catch {
    return [];
  }
}

function normalizeState(state: ParksState): ParksState {
  const visitedParkIds = uniqueIds(state.visitedParkIds);
  const visitedIds = new Set(visitedParkIds);
  const wishlistParkIds = uniqueIds(state.wishlistParkIds).filter((id) => !visitedIds.has(id));

  return {
    visitedParkIds,
    wishlistParkIds,
  };
}

function parseStoredState(rawValue: string | null): ParksState | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== "object") {
      return null;
    }

    const maybeState = parsedValue as Partial<StoredParksState>;
    if (!Array.isArray(maybeState.visitedParkIds) || !Array.isArray(maybeState.wishlistParkIds)) {
      return null;
    }

    return normalizeState({
      visitedParkIds: maybeState.visitedParkIds.filter((id): id is string => typeof id === "string"),
      wishlistParkIds: maybeState.wishlistParkIds.filter((id): id is string => typeof id === "string"),
    });
  } catch {
    return null;
  }
}

function readStoredIds(key: string, legacyKey?: string): string[] {
  const currentIds = parseStoredIds(window.localStorage.getItem(key));
  if (currentIds.length > 0) {
    return currentIds;
  }

  if (legacyKey) {
    return parseStoredIds(window.localStorage.getItem(legacyKey));
  }

  return [];
}

function readStoredParksState(): ParksState {
  const storedState = parseStoredState(window.localStorage.getItem(PARKS_STORAGE_KEY));
  if (storedState) {
    return storedState;
  }

  return normalizeState({
    visitedParkIds: readStoredIds(VISITED_STORAGE_KEY, LEGACY_VISITED_STORAGE_KEY),
    wishlistParkIds: readStoredIds(WISHLIST_STORAGE_KEY, LEGACY_WISHLIST_STORAGE_KEY),
  });
}

function writeStoredParksState(state: ParksState) {
  const storedState: StoredParksState = {
    version: 1,
    ...normalizeState(state),
  };

  window.localStorage.setItem(PARKS_STORAGE_KEY, JSON.stringify(storedState));
}

function parksReducer(state: ParksState, action: ParksAction): ParksState {
  switch (action.type) {
    case "hydrate":
      return normalizeState(action.state);
    case "addVisited":
      return normalizeState({
        visitedParkIds: state.visitedParkIds.includes(action.parkId)
          ? state.visitedParkIds
          : [...state.visitedParkIds, action.parkId],
        wishlistParkIds: state.wishlistParkIds.filter((id) => id !== action.parkId),
      });
    case "removeVisited":
      return {
        ...state,
        visitedParkIds: state.visitedParkIds.filter((id) => id !== action.parkId),
      };
    case "addWishlist":
      return normalizeState({
        visitedParkIds: state.visitedParkIds.filter((id) => id !== action.parkId),
        wishlistParkIds: state.wishlistParkIds.includes(action.parkId)
          ? state.wishlistParkIds
          : [...state.wishlistParkIds, action.parkId],
      });
    case "removeWishlist":
      return {
        ...state,
        wishlistParkIds: state.wishlistParkIds.filter((id) => id !== action.parkId),
      };
    default:
      return state;
  }
}

type ParksProviderProps = {
  children: ReactNode;
};

export function ParksProvider({ children }: ParksProviderProps) {
  const [state, dispatch] = useReducer(parksReducer, INITIAL_PARKS_STATE);
  const [isStorageReady, setIsStorageReady] = useState(false);

  const { visitedParkIds, wishlistParkIds } = state;

  useEffect(() => {
    dispatch({ type: "hydrate", state: readStoredParksState() });
    setIsStorageReady(true);
  }, []);

  useEffect(() => {
    if (!isStorageReady) {
      return;
    }

    try {
      writeStoredParksState(state);
    } catch {
      // Storage can fail in private browsing or when quotas are exceeded.
    }
  }, [isStorageReady, state]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== PARKS_STORAGE_KEY) {
        return;
      }

      const nextState = parseStoredState(event.newValue);
      if (!nextState) {
        return;
      }

      dispatch({ type: "hydrate", state: nextState });
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const addToVisited = useCallback((parkId: string) => {
    dispatch({ type: "addVisited", parkId });
  }, []);

  const removeFromVisited = useCallback((parkId: string) => {
    dispatch({ type: "removeVisited", parkId });
  }, []);

  const addToWishlist = useCallback((parkId: string) => {
    dispatch({ type: "addWishlist", parkId });
  }, []);

  const removeFromWishlist = useCallback((parkId: string) => {
    dispatch({ type: "removeWishlist", parkId });
  }, []);

  const isVisited = useCallback(
    (parkId: string) => visitedParkIds.includes(parkId),
    [visitedParkIds],
  );

  const isInWishlist = useCallback(
    (parkId: string) => wishlistParkIds.includes(parkId),
    [wishlistParkIds],
  );

  const contextValue = useMemo<ParksContextValue>(
    () => ({
      visitedParkIds,
      wishlistParkIds,
      isStorageReady,
      addToVisited,
      removeFromVisited,
      addToWishlist,
      removeFromWishlist,
      isVisited,
      isInWishlist,
    }),
    [
      visitedParkIds,
      wishlistParkIds,
      isStorageReady,
      addToVisited,
      removeFromVisited,
      addToWishlist,
      removeFromWishlist,
      isVisited,
      isInWishlist,
    ],
  );

  return <ParksContext.Provider value={contextValue}>{children}</ParksContext.Provider>;
}

export function useParks() {
  const context = useContext(ParksContext);

  if (!context) {
    throw new Error("useParks must be used within a ParksProvider");
  }

  return context;
}
