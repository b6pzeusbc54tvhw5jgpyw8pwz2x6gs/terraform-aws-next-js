import { useContext } from 'react'
import { NLSContext } from '../nls'
import styles from '../styles/Home.module.css'

export default function Home() {
  const {messages:m} = useContext(NLSContext)
  return (
    <div>
      <main className={styles.main}>
        <h1 className={styles.title}>
          {m.hello} <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <p className={styles.description}>
          This is index.tsx
        </p>
      </main>
    </div>
  )
}
