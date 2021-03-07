import App, {AppProps, AppContext} from 'next/app'
import Head from 'next/head'
import cookie from 'cookie'
import React, { useEffect } from 'react'
import { NextPageContext } from 'next'
import { Global, css } from '@emotion/react'

import { Header } from '../components/Header'
import { NLS } from '../types'
import { NLSContext } from '../nls'
import { Footer } from '../components/Footer'

const cssGlobalStyles = css`
  body {
    margin: 0px;
    padding: 0px;
  }
`

const GlobalStyles = () => <Global styles={cssGlobalStyles}/>

interface Props extends AppProps {
  nls: NLS
}

function MyApp(props: Props) {
  const { Component, pageProps, nls } = props
  useEffect(() => {
    window.__NLS__ = JSON.stringify(nls)
  }, [])
  return (
    <NLSContext.Provider value={nls}>
      <GlobalStyles/>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header/>
      <Component {...pageProps} />
      <Footer/>
    </NLSContext.Provider>
  )
}

// getInitialProps in _app, that disables the ability to
// perform automatic static optimization
// causing every page in your app to be server-side rendered.
// But It's ok. We have cloudfront cache.
MyApp.getInitialProps = async (appContext: AppContext) => {
  // calls page's `getInitialProps` and fills `appProps.pageProps`
  const appProps = await App.getInitialProps(appContext);

  const ctx = appContext.ctx
  const nls = ctx.req
    ? await getNLSInServer(ctx)
    : JSON.parse(window.__NLS__) as NLS

  return { ...appProps, nls }
}

const getNLSInServer = async (ctx: NextPageContext) => {
  if (!ctx.req) throw new Error('Current is not server side')

  const cookies = cookie.parse(ctx.req.headers.cookie || '')
  const queryLocale = Array.isArray(ctx.query?.locale)
    ? ctx.query.locale[0]
    : ctx.query.locale

  const locale = queryLocale || cookies.locale || 'en'
  if(cookies.locale !== locale) {
    const setCookieHeader = cookie.serialize('locale', locale, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 5, // 5 mins
    })
    ctx.res.setHeader('Set-Cookie', setCookieHeader)
  }

  const nls: NLS = (await import(`../nls/${locale || 'en'}`)).nls
  return nls
}

export default MyApp
