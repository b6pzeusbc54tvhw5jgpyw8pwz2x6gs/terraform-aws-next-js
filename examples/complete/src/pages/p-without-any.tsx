import Head from 'next/head'
import Link from 'next/Link'
import styles from '../styles/Home.module.css'

export default function PageWithoutAny() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <p className={styles.description}>
          This is p-without-any.tsx
        </p>

        <div>
          <Link href="/">Go back index('/') page</Link>
          <br/>
          <Link href="/home">/home</Link>
          <br/>
          <Link href="/p-get-initial-props">/p-get-initial-props</Link>
          <br/>
          <Link href="/p-get-server-side-props">/p-get-server-side-props</Link>
          <br/>
          <Link href="/p-get-static-props">/p-get-static-props</Link>
          <br/>
          <Link href="/p-without-any">/p-without-any</Link>
          <br/>
          <Link href="/info/terms">/info/terms</Link>
          <br/>
          <Link href="/posts/aaa">/posts/aaa</Link>
          <br/>
          <Link href="/posts/bbb">/posts/bbb</Link>
          <br/>
          <Link href="/posts/ccc">/posts/ccc</Link>
          <br/>
          <Link href="/newpage/a/b/c">Link /newpage/a/b/c</Link>
          <br/>
          <Link href="/oldpage/a/b/c">Link /oldpage/a/b/c</Link>
          <br/>
          <a href="/newpage/a/b/c">a tag /newpage/a/b/c</a>
          <br/>
          <a href="/oldpage/a/b/c">a tag /oldpage/a/b/c</a>
          <br/>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/vercel.svg" alt="Vercel Logo" className={styles.logo} />
        </a>
      </footer>
    </div>
  )
}
