import fetch, { RequestInit } from 'node-fetch';
import { ProxyConfig } from '../types'

// Fetch with timeout
// Promise.race: https://stackoverflow.com/a/49857905/831465
export function fetchTimeout(
  timeout: number,
  url: string,
  fetchOptions?: RequestInit
) {
  return Promise.race([
    fetch(url, fetchOptions),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Timeout while fetching config from ${url}`)),
        timeout
      )
    ),
  ]);
}

const fetchProxyConfig = async (endpointUri: string): Promise<ProxyConfig> => {
  // Timeout the connection before 30000ms to be able to print an error message
  // See Lambda@Edge Limits for origin-request event here:
  // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-requirements-limits.html#lambda-requirements-see-limits
  const res = await fetchTimeout(29500, endpointUri)
  return await res.json()
}

let proxyConfig: ProxyConfig;
let pendingPromise: Promise<ProxyConfig> | null
let lastFetchedTS: number = 0

/**
 * @param endpointUri 
 * @param ttl (in seconds) time-to-live of proxy config
 */
export const fetchProxyConfigWithCache = async (endpointUri: string, ttl: number): Promise<ProxyConfig> => {
  const now = new Date().getTime()
  const msTTL = ttl * 1000
  if (proxyConfig && now - lastFetchedTS < msTTL) return proxyConfig

  // During the update, instead of waiting, the previous config is used.
  if (pendingPromise) return proxyConfig || pendingPromise

  pendingPromise = fetchProxyConfig(endpointUri)

  // To enhance, check in Lambda and apply below
  /*
  if (proxyConfig) {
    pendingPromise.then(config => {
      // Another thread waits for an update.
      proxyConfig = config
      lastFetchedTS = new Date().getTime()
      pendingPromise = null
      console.log(`Refreshed proxyConfig: ${proxyConfig.buildId}`)
    })

    // Use previous config, instead of waiting.
    return proxyConfig
  }
  */

  // At initial setting, it must wait to fetch
  proxyConfig = await pendingPromise
  lastFetchedTS = new Date().getTime()
  pendingPromise = null
  console.log(`Initial proxyConfig: ${proxyConfig.buildId}`)

  return proxyConfig
}