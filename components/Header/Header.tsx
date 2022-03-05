import { useState } from 'react'
import { Row, Layout, Typography, Col, Button } from 'antd'
import { RiMenuFill } from 'react-icons/ri'
import MenuMobile from '../Menu/Mobile/MenuMobile'
import HeaderStatusLogin from '../HeaderStatusLogin'

export default function Header() {
  // Mobile Sidebar
  const [visible, setVisible] = useState(false)
  const { Header } = Layout
  const { Text } = Typography
  const showDrawer = () => {
    setVisible(true)
  }
  const onClose = () => {
    setVisible(false)
  }
  return (
    <Header className="hp-bg-color-black-0">
      <Row
        className="hp-w-100 hp-position-relative hp-bg-dark-100"
        align="middle"
        justify="space-between"
      >
        <Col className="hp-mobile-sidebar-button hp-mr-24">
          <Button
            className="hp-mobile-sidebar-button"
            type="text"
            onClick={showDrawer}
            icon={
              <RiMenuFill
                size={24}
                className="remix-icon hp-text-color-black-80 hp-text-color-dark-30"
              />
            }
          />
        </Col>
        <Col>
          <Text>Menu-go</Text>
        </Col>
        {/* <Col className="hp-mobile-sidebar-button hp-mr-24">
          <Button
            className="hp-mobile-sidebar-button"
            type="text"
            onClick={showDrawer}
          />
        </Col>  */}
        {/* <Text>Abraham Serrano</Text> */}
        <Col>
          <HeaderStatusLogin />
        </Col>
      </Row>
      <MenuMobile onClose={onClose} visible={visible} />
    </Header>
  )
}
