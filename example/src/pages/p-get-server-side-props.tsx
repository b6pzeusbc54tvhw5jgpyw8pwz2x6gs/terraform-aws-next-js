import { useContext } from 'react'
import { GetServerSideProps } from 'next'
import styles from '../styles/Home.module.css'
import { NLSContext } from '../nls'

export default function PageWithGetStaticProps() {
  const {messages:m} = useContext(NLSContext)
  return (
    <div>
      <main className={styles.main}>
        <h1 className={styles.title}>
          {m.hello} <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <p className={styles.description}>
          This is p-get-server-side-props.tsx
        </p>
      </main>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  console.log('in getServerSideProps')
  return {props: { hello: 'from-get-server-side-props'}}
}
