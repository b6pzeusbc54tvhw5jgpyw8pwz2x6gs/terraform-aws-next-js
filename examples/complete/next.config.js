const { PHASE_PRODUCTION_BUILD } = require('next/constants')


module.exports = (phase, { defaultConfig }) => {
  const dateTime = new Date().toISOString().slice(0,19).replace(/:/g,'')
  // You can replace default with the latest git commit hash or tag here
  const revisionOrTag = process.env.GIT_REVISION || `default`
  const buildId = `${revisionOrTag}-${dateTime}`.replace(/[_: ]/g, '-')

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
  }
};
