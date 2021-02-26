import { NextPage } from 'next'
import { useContext } from 'react'
import { NLSContext } from '../../nls'
import styles from '../../styles/Home.module.css'

interface Props {
  postId: string
}
const PostPage:NextPage<Props> = (props) => {
  const {postId} = props
  const {messages:m} = useContext(NLSContext)

  return (
    <div>
      <main className={styles.main}>
        <h1 className={styles.title}>
          {m.hello} <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <p className={styles.description}>
          PostPage. postId: {postId}
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

PostPage.getInitialProps = async (ctx) => {
  const {postId} = ctx.query

  return { postId: Array.isArray(postId) ? postId[0] : postId }
}

export default PostPage
