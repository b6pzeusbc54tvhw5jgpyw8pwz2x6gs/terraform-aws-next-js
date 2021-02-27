import * as React from 'react'
import Link from 'next/link'

/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from '@emotion/react'

const cssHeader = () => css`
  background-color: rgb(171, 174, 213);
  padding: 0px;
  margin: 0px;
  font-size: 18px;
  width: 100%;
`

const cnPart1 = css`
  background-color: #ffbebe;
`
const cnPart2 = css`
  background-color: #c5d3ff;
`
const cnPart3 = css`
  background-color: #f6bcff;
`

export const Header = () => {
  return (
    <header css={cssHeader}>
      <nav css={cnPart1}>
        <Link href="/"><a>Index</a></Link>
        <Link href="/newpage/[...slug]" as={`/newpage/a/b/c`}><a>Slug Test</a></Link>
        <Link href="/about"><a>About</a></Link>
        <Link href="/"><a>Go back index('/') page</a></Link>
        <Link href="/home"><a>/home</a></Link>
        <Link href="/p-get-initial-props"><a>/p-get-initial-props</a></Link>
        <Link href="/p-get-server-side-props"><a>/p-get-server-side-props</a></Link>
        <Link href="/p-get-static-props"><a>/p-get-static-props</a></Link>
        <Link href="/p-without-any"><a>/p-without-any</a></Link>
        <Link href="/info/terms"><a>/info/terms</a></Link>
        <Link href="/posts/aaa"><a>/posts/aaa</a></Link>
        <Link href="/posts/bbb"><a>/posts/bbb</a></Link>
        <Link href="/posts/ccc"><a>/posts/ccc</a></Link>
      </nav>
      <nav css={cnPart2}>
        <Link href="/newpage/a/b/c"><a>Link /newpage/a/b/c</a></Link>
        <Link href="/oldpage/a/b/c"><a>Link /oldpage/a/b/c</a></Link>
        <a href="/newpage/a/b/c">a tag /newpage/a/b/c</a>
        <a href="/oldpage/a/b/c">a tag /oldpage/a/b/c</a>
      </nav>
      <nav css={cnPart3}>
        <Link href="/image-background"><a>background</a></Link>
        <Link href="/image-quality"><a>quality</a></Link>
        <Link href="/image-https-source"><a>https-source</a></Link>
        <Link href="/image-layout-fill"><a>layout-fill</a></Link>
        <Link href="/image-layout-fixed"><a>layout-fixed</a></Link>
        <Link href="/image-layout-intrinsic"><a>layout-intrinsic</a></Link>
        <Link href="/image-layout-responsive"><a>layout-responsive</a></Link>
      </nav>
      <style jsx>{`
        a {
          font-size: 14px;
          text-decoration: none;
          background-color: #a9ffcc;
          margin: 12px 6px;
          display: inline-block;
          line-height: 20px;
        }
        .is-active {
          text-decoration: underline;
        }
      `}</style>
    </header>
  );
};
