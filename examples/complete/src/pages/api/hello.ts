import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  name: string
  now: string
}

export default (req: NextApiRequest, res: NextApiResponse<Data>) => {
  res.setHeader('Cache-Control', 'no-cache')
  res.status(200).json({ name: 'John Doe', now: new Date().toISOString() })
}
