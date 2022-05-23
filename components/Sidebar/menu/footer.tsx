import React from 'react'
import Link from 'next/link'
import { Avatar, Row, Col } from 'antd'
import { Session } from 'next-auth'
import DropDownFooter from './dropdownFooter'

interface FooterProps {
    collapsed: Boolean
    onClose: any
    session?: Session | null
}

export default function MenuFooter(props: FooterProps) {
    const { session } = props

    return props.collapsed === false ? (
        <DropDownFooter {...props} />
    ) : (
        <Row
            className="hp-sidebar-footer hp-pt-16 hp-mb-16 hp-bg-color-dark-100"
            align="middle"
            justify="center"
        >
            <Col>
                <Link href="/pages/profile/personel-information">
                    <a onClick={props.onClose}>
                        <Avatar
                            size={36}
                            src={session?.user?.image}
                            alt={`avatar-${session?.user?.name}`}
                        />
                    </a>
                </Link>
            </Col>
        </Row>
    )
}
