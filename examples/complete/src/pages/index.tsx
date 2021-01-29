import { format } from 'url';
import { GetServerSideProps, NextPage } from 'next'
import { useRouter } from 'next/router';
import Link from 'next/Link'

interface Props {
  initialPropsCounter: number
  slug: string[] | string
}

let counter = 0;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  counter++;
  return { props: { initialPropsCounter: counter } };
}

const Index: NextPage<Props> = (props) => {  const router = useRouter();
  const {initialPropsCounter} = props
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
      <h2>This is the Home Page</h2>

      <button onClick={reload}>Reload</button>
      <button onClick={incrementCounter}>Change State Counter</button>
      <p>"getServerSideProps" ran for "{initialPropsCounter}" times.</p>
      <p>Counter: "{query.counter || 0}".</p>
      <Link href="/home">Go test other pages</Link>
    </div>
  );
}

export default Index
