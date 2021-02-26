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

export const Header = () => {
  return (
    <header css={cssHeader}>
      <nav>
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
        <Link href="/newpage/a/b/c"><a>Link /newpage/a/b/c</a></Link>
        <Link href="/oldpage/a/b/c"><a>Link /oldpage/a/b/c</a></Link>
        <a href="/newpage/a/b/c">a tag /newpage/a/b/c</a>
        <a href="/oldpage/a/b/c">a tag /oldpage/a/b/c</a>
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
