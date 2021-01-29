// import App from "next/app";
import type { AppProps /*, AppContext */ } from 'next/app'
import Head from 'next/head'
import { Global, css } from '@emotion/react'
import { Header } from '../components/Header'

const cssGlobalStyles = css`
  body {
    margin: 0px;
    padding: 0px;
  }
`

const GlobalStyles = () => <Global styles={cssGlobalStyles}/>

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <GlobalStyles/>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header/>
      <Component {...pageProps} />
    </>
  )
}

// Only uncomment this method if you have blocking data requirements for
// every single page in your application. This disables the ability to
// perform automatic static optimization, causing every page in your app to
// be server-side rendered.
//
// MyApp.getInitialProps = async (appContext: AppContext) => {
//   // calls page's `getInitialProps` and fills `appProps.pageProps`
//   const appProps = await App.getInitialProps(appContext);

//   return { ...appProps }
// }

export default MyApp
