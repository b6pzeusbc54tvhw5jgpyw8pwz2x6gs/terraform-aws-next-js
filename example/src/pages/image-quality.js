import Image from 'next/image'
import ViewSource from '../components/view-source'

const Fill = () => (
  <div>
    <ViewSource pathname="pages/layout-fill.js" />
    <h1>Image Component With Quality: 100</h1>
    <div style={{ position: 'relative', width: '1440px', height: '960px' }}>
      <Image
        alt="Mountains"
        src="/mountains.jpg"
        layout="fill"
        quality={100}
      />
    </div>

    <h1>Image Component With Quality: 50</h1>
    <div style={{ position: 'relative', width: '1440px', height: '960px' }}>
      <Image
        alt="Mountains"
        src="/mountains.jpg"
        layout="fill"
        quality={50}
      />
    </div>

    <h1>Image Component With Quality: 1</h1>
    <div style={{ position: 'relative', width: '1440px', height: '960px' }}>
      <Image
        alt="Mountains"
        src="/mountains.jpg"
        layout="fill"
        quality={1}
      />
    </div>
  </div>
)

export default Fill
