import React from 'react'
import { Layout, Button, Row, Col } from 'antd'
import { useSession } from 'next-auth/react'
import { RiMenuFill } from 'react-icons/ri'
import HeaderUser from './HeaderUser'
import { Session } from 'next-auth'

const { Header } = Layout

interface HeaderProps {
    setVisible: Function
}

interface ContextSession {
    data: Session | null
    status: string
}

export default function MenuHeader(props: HeaderProps) {
    const { setVisible } = props
    const { data: session }: ContextSession = useSession()

    // Mobile Sidebar
    const showDrawer = () => {
        setVisible(true)
    }

    // Children
    const headerChildren = () => {
        return (
            <Row
                className="hp-w-100 hp-position-relative"
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

                <Col
                    xl={16}
                    lg={14}
                    className="hp-header-left-text hp-d-flex-center"
                >
                    {/* Nothing for now */}
                </Col>

                <Col>
                    <Row align="middle">
                        <Col className="hp-d-flex-center hp-mr-4"></Col>
                        <HeaderUser session={session} />
                    </Row>
                </Col>
            </Row>
        )
    }

    return (
        <Header>
            <Row justify="center" className="hp-w-100">
                <Col xxl={20} xl={22} span={24}>
                    {headerChildren()}
                </Col>
            </Row>
        </Header>
    )
}
