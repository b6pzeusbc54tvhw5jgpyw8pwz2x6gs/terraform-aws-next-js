const logLevels = ['ERROR','WARN','INFO','VERBOSE','DEBUG','SILLY'] as const
type LogLevel = typeof logLevels[number]

const isLogLevel = (level: any): level is LogLevel => {
  return logLevels.indexOf(level) > -1
}

let loggers: Record<string, Logger>
export const getLogger = (pLogLevel: string, type: string='-') => {
  const key = `${pLogLevel}-${type}`
  if (loggers[key]) return loggers[key]

  const logLevel: LogLevel = isLogLevel(pLogLevel) ? pLogLevel : 'INFO'
  loggers[key] = createLogger(type, logLevel)
  return loggers[key]
}

export type Logger = {
  debug: (msg: string | Object) => void
  info: (msg: string | Object) => void
  warn: (msg: string | Object) => void
  error: (msg: string | Object) => void
}

const shouldLoggerSkip = (logLevel: LogLevel, methodLevel: LogLevel) => {
  return logLevels.indexOf(logLevel) < logLevels.indexOf(methodLevel)
}

export const createLogger = (type: string, logLevel: LogLevel) => {
  const logger: Logger = {
    debug: (msg: string | Object) => {
      if (shouldLoggerSkip(logLevel, 'DEBUG')) return

      console.log(`DEBUG [${type}] ${msg}`)
    },
    info: (msg: string | Object) => {
      if (shouldLoggerSkip(logLevel, 'INFO')) return

      console.info(`INFO [${type}] ${msg}`)
    },
    warn: (msg: string | Object) => {
      if (shouldLoggerSkip(logLevel, 'WARN')) return

      console.warn(`WARN [${type}] ${msg}`)
    },
    error: (msg: string | Object) => {
      if (shouldLoggerSkip(logLevel, 'ERROR')) return

      console.error(`ERROR [${type}] ${msg}`)
    },
  }
  return logger
}
