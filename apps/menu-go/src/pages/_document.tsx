// @ts-nocheck
import Document, { Head, Html, Main, NextScript } from 'next/document';
import React from 'react';

export default class MyDocument extends Document {
  render(): JSX.Element {
    return (
      <Html lang="en" className="h-full bg-white">
        <Head>
          <meta charSet="utf-8" />
        </Head>
        <body className="h-full">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
