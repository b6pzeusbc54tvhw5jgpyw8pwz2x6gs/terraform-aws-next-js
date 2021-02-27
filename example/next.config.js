// @ts-check
const {PHASE_PRODUCTION_BUILD, } = require('next/constants')

/** @type {import("next/config")} */
module.exports = (phase, { defaultConfig }) => {
  const dateTime = new Date().toISOString().slice(0,19).replace(/:/g,'')
  // You can replace default with the latest git commit hash or tag here
  const branchOrTag = process.env.BRANCH_OR_TAG || `default`
  const buildId = phase === PHASE_PRODUCTION_BUILD
    ? `${branchOrTag}-${dateTime}`.replace(/[_: ]/g, '-')
    : `${branchOrTag}-local`

  return {
    generateBuildId: () => {
      return phase === PHASE_PRODUCTION_BUILD ? buildId : 'local'
    },
    assetPrefix: phase === PHASE_PRODUCTION_BUILD
      ? `/static/${buildId}`
      : void 0,
    async rewrites() {
      return [
        {
          source: '/robots.txt',
          destination: '/api/robots',
        },
      ];
    },
    async redirects() {
      return [
        {
          source: '/oldpage/:slug*',
          destination: '/newpage/:slug*', // Matched parameters can be used in the destination
          permanent: true,
        },
      ];
    },
    images: {
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      // path: '/_next/image',
      path: `/image/${buildId}/`,
      loader: 'default',
      domains: [],
    },
  }
};
