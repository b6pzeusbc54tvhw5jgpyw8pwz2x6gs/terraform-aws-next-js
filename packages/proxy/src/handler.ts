import * as path from 'path';
import { STATUS_CODES } from 'http';
import { CloudFrontRequestHandler, CloudFrontHeaders, CloudFrontRequest, CloudFrontResultResponse } from 'aws-lambda';
import { ProxyConfig, HTTPHeaders, ApiGatewayOriginProps, RouteResult } from './types';
import { Proxy } from './proxy';
import { fetchProxyConfigWithCache } from './util/fetch-proxy-config';
import { getLogger } from './util/logger'

let proxy: Proxy;
let cachedProxyConfig: ProxyConfig

function convertToCloudFrontHeaders(
  initialHeaders: CloudFrontHeaders,
  headers: HTTPHeaders
): CloudFrontHeaders {
  const cloudFrontHeaders: CloudFrontHeaders = { ...initialHeaders };
  for (const key in headers) {
    const lowercaseKey = key.toLowerCase();
    cloudFrontHeaders[lowercaseKey] = [{ key, value: headers[key] }];
  }

  return cloudFrontHeaders;
}

/**
 * Checks if a route result issued a redirect
 */
function isRedirect(routeResult: RouteResult): false | CloudFrontResultResponse {
  const {status, headers} = routeResult
  if (status && status >= 300 && status <= 309) {
    if ('Location' in routeResult.headers) {
      let additionalHeaders: CloudFrontHeaders = {};

      // If the redirect is permanent, add caching it
      if (status === 301 || status === 308) {
        additionalHeaders['cache-control'] = [
          {
            key: 'Cache-Control',
            value: 'public,max-age=31536000,immutable',
          },
        ];
      }

      return {
        status: status.toString(),
        statusDescription: STATUS_CODES[status],
        headers: convertToCloudFrontHeaders(additionalHeaders, headers),
      };
    }
  }

  return false;
}

/**
 * Modifies the request that it is served by API Gateway (Lambda)
 */
function serveFromApiGateway(
  request: CloudFrontRequest,
  apiEndpoint: string,
  { path }: ApiGatewayOriginProps
) {
  request.origin = {
    custom: {
      domainName: apiEndpoint,
      path,
      customHeaders: {},
      keepaliveTimeout: 60,
      port: 443,
      protocol: 'https',
      readTimeout: 30,
      sslProtocols: ['TLSv1.2'],
    },
  };

  // Set Host header to the apiEndpoint
  return {
    host: apiEndpoint,
  };
}

export const handler: CloudFrontRequestHandler = async (event) => {
  const { request } = event.Records[0].cf;
  const {customHeaders} = request.origin?.s3 || { customHeaders: {} }
  const configEndpoint = customHeaders['x-env-config-endpoint'][0].value;
  const apiEndpoint = customHeaders['x-env-api-endpoint'][0].value;
  const logLevel = customHeaders['x-enable-debug']?.[0]?.value || 'INFO';
  const configTTL = Number(customHeaders['x-env-config-ttl']?.[0]?.value || '60')

  const logger = getLogger(logLevel)
  logger.debug('host: ' + request.headers['host']?.[0]?.value)

  let headers: Record<string, string> = {};

  try {
    const proxyConfig = await fetchProxyConfigWithCache(configEndpoint, configTTL);
    if (cachedProxyConfig !== proxyConfig) {
      cachedProxyConfig = proxyConfig
      proxy = new Proxy(proxyConfig.routes, proxyConfig.lambdaRoutes, proxyConfig.staticRoutes);
    }
  } catch (err) {
    console.error('Error while initialization:', err);
    return request;
  }

  const {prerenders, buildId} = cachedProxyConfig

  // Append query string if we have one
  // @see: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html
  const requestPath = `${request.uri}${
    request.querystring !== '' ? `?${request.querystring}` : ''
  }`;

  // Check if we have a prerender route
  // Bypasses proxy
  if (request.uri in prerenders) {
    headers = serveFromApiGateway(request, apiEndpoint, {
      path: `/${prerenders[request.uri].lambda}`,
    });
  } else {
    // Handle by proxy
    const proxyResult = proxy.route(requestPath);

    // Check for redirect
    const redirect = isRedirect(proxyResult);
    if (redirect) {
      logger.debug('redirect: ' + redirect)
      return redirect;
    }

    // Check if route is served by lambda
    if (proxyResult.target === 'lambda') {
      headers = serveFromApiGateway(request, apiEndpoint, {
        path: proxyResult.dest,
      });

      request.querystring = proxyResult.uri_args
        ? proxyResult.uri_args.toString()
        : '';

      logger.debug(`proxyResult.target === 'lambda'`)

    } else if (proxyResult.phase === 'error' && proxyResult.status === 404) {
      // Send 404 directly to S3 bucket for handling without rewrite
      logger.debug("phase === 'error' && status === 404");
      logger.debug(`request.uri: ${request.uri}, proxyResult.dest: ${proxyResult.dest}`);
      return request;
    } else {
      // Route is served by S3 bucket
      if (proxyResult.found) {
        logger.debug('proxyResult.found: ' + proxyResult.found);
        logger.debug(path.join(`/${buildId}`, proxyResult.dest));
        request.uri = path.join(`/${buildId}`, proxyResult.dest);
      }
    }

    headers = { ...proxyResult.headers, ...headers };
  }

  // Modify headers
  request.headers = convertToCloudFrontHeaders(request.headers, headers);

  request.uri = request.uri || '/';

  logger.debug("End of handler");
  logger.debug(`request.uri: ${request.uri}`);
  return request;
};
