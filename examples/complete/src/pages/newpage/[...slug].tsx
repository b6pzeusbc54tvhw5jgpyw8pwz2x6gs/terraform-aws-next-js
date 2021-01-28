import { format } from 'url';
import { ParsedUrlQuery } from 'querystring'
import { GetServerSideProps, NextPage } from 'next'
import { useRouter } from 'next/router';
import Link from 'next/Link';

import { Header } from '../../components/Header';

interface Props {
  initialPropsCounter: number
  slug: string[] | string
  query: ParsedUrlQuery
  params: ParsedUrlQuery
}

let counter = 0;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  counter++;
  return {
    props: {
      params: ctx.params,
      query: ctx.query,
      slug: ctx.query && ctx.query.slug,
      initialPropsCounter: counter,
    },
  };
}

const NewPage: NextPage<Props> = (props) => {
  const { initialPropsCounter, slug, params, query: serverQuery } = props
  const router = useRouter();
  const { pathname, query } = router;

  const reload = () => {
    router.push(format({ pathname, query }));
  };
  const incrementCounter = () => {
    const counter = Array.isArray(query.counter) ? query.counter[0] : query.counter
    const currentCounter = counter ? parseInt(counter) : 0;
    const href = `/?counter=${currentCounter + 1}`;

    router.push(href, href, { shallow: true });
  };

  return (
    <div>
      <Header />

      <h2>This is the Home Page</h2>
      <Link href="/about">
        <a>About</a>
      </Link>
      <button onClick={reload}>Reload</button>
      <pre>Server: {JSON.stringify(slug)}</pre>
      <pre>Client: {JSON.stringify(query.slug)}</pre>

      <pre>Params: {JSON.stringify(params)}</pre>
      <pre>Query: {JSON.stringify(serverQuery)}</pre>
      <button onClick={incrementCounter}>Change State Counter</button>
      <p>"getServerSideProps" ran for "{initialPropsCounter}" times.</p>
      <p>Counter: "{query.counter || 0}".</p>
    </div>
  );
}

export default NewPage
