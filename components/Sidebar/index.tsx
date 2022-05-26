import React, { useState } from 'react'
// import Link from 'next/link'

import { Layout, Row, Col } from 'antd'
// import { RiMenuFoldLine, RiMenuUnfoldLine } from 'react-icons/ri'
import { useSession } from 'next-auth/react'
import { Session } from 'next-auth'

import MenuLogo from './menu/logo'
import MenuFooter from './menu/footer'
import MenuItem from './menu/item'
// import MenuMobile from './mobile'

const { Sider } = Layout

interface SiderbarProps {
    setVisible: Function
    visible: Boolean
}

interface ContextSession {
    data: Session | null
    status: string
}

export default function Sidebar(props: SiderbarProps) {
    const { setVisible } = props
    const { data: session }: ContextSession = useSession()

    // Collapsed
    const [collapsed] = useState(false)

    // Mobile Sidebar
    const onClose = () => {
        setVisible(false)
    }

    // Menu
    // function toggle() {
    //   setCollapsed(!collapsed)
    // }

    // const trigger = createElement(collapsed ? RiMenuUnfoldLine : RiMenuFoldLine, {
    //   className: 'trigger',
    //   onClick: toggle,
    // })

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={256}
            className="hp-sidebar hp-bg-color-black-0 hp-bg-color-dark-100"
        >
            <Row
                className="hp-mr-12 hp-ml-24 hp-mt-24"
                align="bottom"
                justify="space-between"
            >
                <Col>{collapsed === false ? <MenuLogo /> : ''}</Col>

                {/* {customise.sidebarCollapseButton && (
          <Col className="hp-pr-0">
            <Button
              icon={trigger}
              type="text"
              className="hp-float-right hp-text-color-dark-0"
            ></Button>
          </Col>
        )} */}

                {collapsed !== false && (
                    <Col className="hp-mt-8">
                        {/* <Link to="/" onClick={onClose}>
              <img className="hp-logo" src={logoSmall} alt="logo" />
            </Link> */}
                    </Col>
                )}
            </Row>

            <MenuItem onClose={onClose} />

            <MenuFooter
                onClose={onClose}
                collapsed={collapsed}
                session={session}
            />

            {/* <MenuMobile onClose={onClose} visible={visible} />  */}
        </Sider>
    )
}
