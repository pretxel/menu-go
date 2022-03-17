import React from 'react'
import Link from 'next/link'
import randomAvatar from '../../../lib/randomAvatar'
import { Divider, Avatar, Row, Col } from 'antd'
import { RiSettings3Line } from 'react-icons/ri'
import { Session } from 'next-auth'

interface FooterProps {
  collapsed: Boolean
  onClose: Function
  session?: Session
}

export default function MenuFooter(props: FooterProps) {
  const avatarImg = randomAvatar()
  return props.collapsed === false ? (
    <Row
      className="hp-sidebar-footer hp-pb-24 hp-px-24 hp-bg-color-dark-100"
      align="middle"
      justify="space-between"
    >
      <Divider className="hp-border-color-black-20 hp-border-color-dark-70 hp-mt-0" />

      <Col>
        <Row align="middle">
          <Avatar size={36} src={avatarImg} className="hp-mr-8" />

          <div>
            <span className="hp-d-block hp-text-color-black-100 hp-text-color-dark-0 hp-p1-body">
              {props.session.user?.name}
            </span>

            <Link href="/pages/profile/personel-information">
              <a
                className="hp-badge-text hp-text-color-dark-30"
                onClick={props.onClose}
              >
                View Profile
              </a>
            </Link>
          </div>
        </Row>
      </Col>

      <Col>
        <Link href="/pages/profile/security">
          <RiSettings3Line
            className="remix-icon hp-text-color-black-100 hp-text-color-dark-0"
            size={24}
            onClick={props.onClose}
          />
        </Link>
      </Col>
    </Row>
  ) : (
    <Row
      className="hp-sidebar-footer hp-pt-16 hp-mb-16 hp-bg-color-dark-100"
      align="middle"
      justify="center"
    >
      <Col>
        <Link to="/pages/profile/personel-information">
          <a onClick={props.onClose}>
            <Avatar size={36} src={avatarImg} />
          </a>
        </Link>
      </Col>
    </Row>
  )
}
