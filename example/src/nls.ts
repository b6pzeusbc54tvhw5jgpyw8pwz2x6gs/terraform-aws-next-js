import { createContext } from "react"
import { NLS } from "./types"

const initial: NLS = {
  locale: 'en',
  messages: {},
}

export const NLSContext = createContext(initial)
