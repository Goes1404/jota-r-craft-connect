import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './light-theme.css'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

createRoot(document.getElementById("root")!).render(
  <NextThemesProvider
    attribute="class"
    defaultTheme="dark"
    storageKey="jotar-theme"
    enableSystem={false}
    disableTransitionOnChange
  >
    <App />
  </NextThemesProvider>
);
