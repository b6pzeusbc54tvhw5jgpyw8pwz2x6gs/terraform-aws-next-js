import { useContext } from "react"
import { NLSContext } from "../nls"

const NEXT_PUBLIC_APP_REVISION = process.env.NEXT_PUBLIC_APP_REVISION

export default function About() {
  const {messages:m} = useContext(NLSContext)
  return (
    <div>
      {m.hello}
      <h2>About us</h2>
      <div>
        version: {NEXT_PUBLIC_APP_REVISION}
      </div>
    </div>
  );
}
