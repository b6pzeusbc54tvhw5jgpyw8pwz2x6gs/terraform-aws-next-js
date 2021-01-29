import * as React from 'react';
import Link from 'next/Link';

/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from '@emotion/react'

const cssHeader = () => css`
  background-color: rgb(171, 174, 213);
  height: 48px;
  padding: 0px;
  margin: 0px;
  font-size: 18px;
`

export const Header = () => {
  return (
    <header css={cssHeader}>
      <nav>
        <Link href="/">
          <a>Index</a>
        </Link>
        <Link href="/newpage/[...slug]" as={`/newpage/a/b/c`}>
          <a>Slug Test</a>
        </Link>
        <Link href="/about">
          <a>About</a>
        </Link>
      </nav>
      <style jsx>{`
        nav {
          display: flex;
        }
        a {
          font-size: 14px;
          margin-right: 15px;
          text-decoration: none;
        }
        .is-active {
          text-decoration: underline;
        }
      `}</style>
    </header>
  );
};
