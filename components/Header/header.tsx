import { Button, Col, Menu, Row, Dropdown } from 'antd'
import { RiMenuFill } from 'react-icons/ri'
import HeaderStatusLogin from '../HeaderStatusLogin'
export default function PanelHeader() {
  return (
    <header className="hp-my-8">
      <div className="hp-landing-container">
        <Row align="middle" justify="space-between">
          <Col>
            {/* <MenuLogo /> */}
            <p>Logo</p>
          </Col>

          <Col className="hp-landing-header-mobile-button">
            <Dropdown
              placement="bottomRight"
              overlay={
                <Menu mode="vertical" className="hp-bg-dark-90">
                  <Menu.Item key={3}>
                    <Row justify="space-between">
                      <HeaderStatusLogin />
                    </Row>
                  </Menu.Item>
                </Menu>
              }
            >
              <Button
                type="text"
                icon={
                  <RiMenuFill
                    size={24}
                    className="remix-icon hp-text-color-black-80 hp-text-color-dark-30"
                  />
                }
              />
            </Dropdown>
          </Col>

          <Col flex="1 0 0" className="hp-px-24 hp-landing-header-menu">
            <Menu
              mode="horizontal"
              className="hp-d-flex-full-center hp-bg-dark-90"
            />
          </Col>

          <Col className="hp-landing-header-buttons">
            <HeaderStatusLogin />
          </Col>
        </Row>
      </div>
    </header>
  )
}
