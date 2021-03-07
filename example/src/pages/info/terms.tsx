import Link from 'next/link'
import { useContext } from 'react'
import { NLSContext } from '../../nls'
import styles from '../../styles/Home.module.css'

export default function Terms() {
  const {messages:m} = useContext(NLSContext)
  return (
    <div>
      <main className={styles.main}>
        <h1 className={styles.title}>
          {m.hello} <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <p className={styles.description}>
          This is /info/terms.tsx
        </p>
      </main>
    </div>
  )
}
