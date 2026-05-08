import { useLocation } from "react-router-dom";

/** Preserve list filters when navigating back from detail. */
export function useBackToList(): string {
  const location = useLocation();
  return location.search ? `/${location.search}` : "/";
}
