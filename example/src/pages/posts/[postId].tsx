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
    </div>
  )
}

PostPage.getInitialProps = async (ctx) => {
  const {postId} = ctx.query

  return { postId: Array.isArray(postId) ? postId[0] : postId }
}

export default PostPage
