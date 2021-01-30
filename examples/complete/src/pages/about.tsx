import { useContext } from "react"
import { NLSContext } from "../nls"

export default function About() {
  const {messages:m} = useContext(NLSContext)
  return (
    <div>
      {m.hello}
      <h2>About us</h2>
    </div>
  );
}
