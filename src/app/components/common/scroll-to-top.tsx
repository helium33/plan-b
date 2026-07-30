import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router keeps the scroll position across navigations, which lands you
 * mid-page after following a link. Reset on every path change — but not on
 * `?query` changes, so shop filters and sorting do not yank the grid upward.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, left: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [pathname]);

  return null;
}
