/* eslint-disable perfectionist/sort-imports */
import 'src/global.css';

import { useScrollToTop } from 'src/hooks/use-scroll-to-top';
import useAutoLogout from 'src/hooks/useAutoLogout';

import Router from 'src/routes/sections';
import ThemeProvider from 'src/theme';

// ----------------------------------------------------------------------

export default function App() {
  useScrollToTop();
  useAutoLogout();

  return (
    <ThemeProvider>
      <Router />
    </ThemeProvider>
  );
}
