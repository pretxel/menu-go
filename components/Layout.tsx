import Header from './Header/Header'
import { Layout as LayoutAntd } from 'antd'
interface Props {
  children: any
}

export default function Layout({ children }: Props) {
  return (
    <LayoutAntd className={`hp-app-layout hp-bg-color-dark-90`}>
      <Header />
      <main>{children}</main>
    </LayoutAntd>
  )
}
