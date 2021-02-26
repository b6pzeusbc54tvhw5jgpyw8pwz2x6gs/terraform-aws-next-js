import { NextPageContext } from 'next'
import React, { useContext } from 'react'
import { NLSContext } from '../nls'
import styles from '../styles/Home.module.css'

export default function PageWithGetInitialProps() {
  const {messages:m} = useContext(NLSContext)
  return (
    <div>
      <main className={styles.main}>
        <h1 className={styles.title}>
          {m.hello} <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <p className={styles.description}>
          This is p-get-initial-props.tsx
        </p>
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

PageWithGetInitialProps.getInitialProps = async (ctx: NextPageContext) => {
  return {hello: 'from-get-initial-props'}
}
