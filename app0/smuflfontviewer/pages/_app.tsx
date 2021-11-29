import React, { ReactElement } from 'react';
import '../styles/globals.css';
import { AppProps } from 'next/app';
import { CssBaseline, ThemeProvider, Theme, StyledEngineProvider } from '@mui/material';
import theme from '../styles/theme';


declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}


export default function MyApp({ Component, pageProps }: AppProps): ReactElement {
  React.useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      const parentElm = jssStyles.parentElement;
      if (parentElm) {
        parentElm.removeChild(jssStyles);
      }
    }
  }, []);
  return (
    <React.Fragment>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          <Component {...pageProps} />
        </ThemeProvider>
      </StyledEngineProvider>
    </React.Fragment>
  );
}
