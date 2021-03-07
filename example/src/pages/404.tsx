import { GetStaticProps } from 'next'
import Error from 'next/error'

export default function ErrorPage() {
  return <Error statusCode={404}/>
}

// Adding getStaticProps makes "/404" file by `tfbuild`
export const getStaticProps: GetStaticProps = async (ctx) => {
  return {props: { hello: 'from-get-static-props'}}
}
