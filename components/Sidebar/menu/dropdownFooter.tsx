import React from 'react'
import Link from 'next/link'
import { Divider, Avatar, Row, Col, Dropdown } from 'antd'
import { RiSettings3Line } from 'react-icons/ri'
import { Session } from 'next-auth'
import { signOut } from 'next-auth/react'
interface DropdownFooterProps {
    collapsed: Boolean
    onClose: any
    session?: Session | null
}
export default function DropDownFooter(props: DropdownFooterProps) {
    const { session } = props
    const nameShort = session?.user?.name?.match(/^([\w]+)\s([\w]+)/)![0]
    const menu = (
        <div
            className="hp-border-radius hp-border-1 hp-border-color-black-40 hp-bg-black-0 hp-bg-dark-100 hp-border-color-dark-80 hp-p-24 hp-mt-12"
            style={{ width: 260 }}
        >
            <span className="hp-d-block h5 hp-text-color-black-100 hp-text-color-dark-0 hp-mb-8">
                {session?.user?.name}
            </span>

            <Link href={`/pages/profile/personel-information`}>
                View Profile
            </Link>

            <Divider className="hp-mb-16 hp-mt-6" />

            <Link href="/" passHref>
                <a className="hp-p1-body" onClick={() => signOut()}>
                    Log Out
                </a>
            </Link>
        </div>
    )

    return (
        <div>
            <Row
                className="hp-sidebar-footer hp-pb-24 hp-px-24 hp-bg-color-dark-100"
                align="middle"
                justify="space-between"
            >
                <Divider className="hp-border-color-black-20 hp-border-color-dark-70 hp-mt-0" />
                <Col>
                    <Row align="middle">
                        <Avatar
                            size={36}
                            src={session?.user?.image}
                            className="hp-mr-8"
                            alt={`avatar-${session?.user?.name}`}
                        />

                        <Dropdown overlay={menu}>
                            <span
                                className="hp-text-color-dark-30 hp-text-color-dark-0 hp-p1-body"
                                style={{ cursor: 'pointer' }}
                            >
                                {nameShort}
                            </span>
                        </Dropdown>
                    </Row>
                </Col>
                <Col>
                    <Link href="/pages/profile/security" passHref>
                        <RiSettings3Line
                            className="remix-icon hp-text-color-black-100 hp-text-color-dark-0"
                            size={26}
                            onClick={props.onClose}
                        />
                    </Link>
                </Col>
            </Row>
        </div>
    )
}
