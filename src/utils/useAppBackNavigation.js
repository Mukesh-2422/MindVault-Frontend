import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * useAppBackNavigation
 *
 * Logical "Back" navigation for the MindVault app.
 *
 * Order of resolution:
 *   1. If the current location carries an explicit navigation origin
 *      (location.state.from) and it is not this page, go back there first.
 *      This is how Memory Detail returns to Collections/Timeline/People/Search
 *      depending on where it was opened from.
 *   2. Otherwise fall back to the page's logical parent route (defaults to
 *      "/home").
 *
 * This intentionally avoids `navigate(-1)`, which pushes users through raw
 * browser history and creates loops on deeply nested pages (e.g. the
 * Profile <-> Settings loop).
 */
export function useAppBackNavigation(parent = "/home") {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    const from = location.state?.from;
    if (typeof from === "string" && from && from !== location.pathname) {
      navigate(from);
      return;
    }
    navigate(parent);
  }, [navigate, location.pathname, location.state?.from, parent]);
}
