import { GetStaticProps } from 'next'
import { useContext } from 'react'
import { NLSContext } from '../nls'
import styles from '../styles/Home.module.css'

export default function PageWithGetStaticProps() {
  const {messages:m} = useContext(NLSContext)
  return (
    <div>
      <main className={styles.main}>
        <h1 className={styles.title}>
          {m.hello} <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <p className={styles.description}>
          This is p-get-static-props.tsx
        </p>
      </main>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async (ctx) => {
  return {props: { hello: 'from-get-static-props'}}
}
