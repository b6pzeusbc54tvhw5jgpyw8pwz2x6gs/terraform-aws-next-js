import type { NextApiRequest, NextApiResponse } from 'next'

const content = `
# Example robots.txt

User-agent: *
Allow: /

Sitemap: http://www.example.com/sitemap.xml
`.trim();

const RobotsHandler = (_req: NextApiRequest, res: NextApiResponse<string>) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end(content);
};

export default RobotsHandler;
