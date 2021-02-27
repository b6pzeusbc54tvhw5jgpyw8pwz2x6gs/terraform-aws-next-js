import Image from 'next/image'
import ViewSource from '../components/view-source'

const Fill = () => (
  <div>
    <ViewSource pathname="pages/layout-fill.js" />
    <h1>https://bigcommerce-demo-asset-ksvtgfvnd.vercel.app/bigcommerce.png</h1>
    <div style={{ position: 'relative', width: '1440px', height: '960px' }}>
      <Image
        alt="Mountains"
        src="https://bigcommerce-demo-asset-ksvtgfvnd.vercel.app/bigcommerce.png"
        layout="fill"
        quality={100}
      />
    </div>

  </div>
)

export default Fill
