import React, { ReactElement } from 'react';
import '../styles/globals.css';
import { AppProps } from 'next/app';

export default function MyApp({ Component, pageProps }: AppProps): ReactElement {
  return <Component {...pageProps} />;
}
