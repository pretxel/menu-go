import React, { useState } from 'react'

// import { useSelector } from "react-redux";

import { Layout, Row, Col } from 'antd'

import Sidebar from '../Sidebar'
import MenuHeader from '../Header'
// import MenuFooter from './components/footer'
// import CustomiseTheme from './components/customise'
// import ScrollTop from './components/scroll-to-top'

const { Content } = Layout

interface LayoutProps {
    children: any
}

export default function VerticalLayout(props: LayoutProps) {
    // eslint-disable-next-line react/prop-types
    const { children } = props

    const [visible, setVisible] = useState(false)

    // Redux
    // const customise = useSelector(state => state.customise)

    return (
        <Layout className="hp-app-layout">
            <Sidebar visible={visible} setVisible={setVisible} />

            <Layout className="hp-bg-color-dark-90">
                <MenuHeader setVisible={setVisible} />

                <Content className="hp-content-main">
                    <Row justify="center">
                        <Col xxl={20} xl={22} span={24}>
                            {children}
                        </Col>
                    </Row>
                </Content>

                {/* <MenuFooter /> */}
            </Layout>
            {/* <ScrollTop /> */}
        </Layout>
    )
}
