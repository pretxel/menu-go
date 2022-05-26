import { Button, Col, Menu, Row, Dropdown } from 'antd'
import { RiMenuFill } from 'react-icons/ri'
import HeaderStatusLogin from '../../components/HeaderStatusLogin'
export default function LandingHeader() {
    // const loginButton = (
    //   <Button
    //     type="primary"
    //     className="hp-px-sm-16 hp-py-sm-8 hp-px-32 hp-py-16 hp-ml-sm-0 hp-ml-8"
    //   >
    //     <Link href="/auth/login" passHref>
    //       Login
    //     </Link>
    //   </Button>
    // )

    // const signUpButton = (
    //   <Button
    //     type="text"
    //     className="hp-px-sm-16 hp-py-sm-8 hp-px-32 hp-py-16 hp-ml-sm-8 hp-text-color-black-80 hp-text-color-dark-30"
    //   >
    //     <Link href="/auth/register" passHref>
    //       Sign Up
    //     </Link>
    //   </Button>
    // )

    const menuItems = (
        <>
            <Menu.Item key={0} className="hp-border-radius">
                <a href="#">Demos</a>
            </Menu.Item>

            <Menu.Item key={1} className="hp-border-radius">
                <a href="#">Features</a>
            </Menu.Item>

            <Menu.Item key={2} className="hp-border-radius">
                <a href="#">Pricing</a>
            </Menu.Item>
        </>
    )

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
                                    {menuItems}

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

                    <Col
                        flex="1 0 0"
                        className="hp-px-24 hp-landing-header-menu"
                    >
                        <Menu
                            mode="horizontal"
                            className="hp-d-flex-full-center hp-bg-dark-90"
                        >
                            {menuItems}
                        </Menu>
                    </Col>

                    <Col className="hp-landing-header-buttons">
                        <HeaderStatusLogin />
                    </Col>
                </Row>
            </div>
        </header>
    )
}
