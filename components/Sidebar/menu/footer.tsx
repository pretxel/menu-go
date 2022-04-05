import { useMemo } from 'react'
import Link from 'next/link'
import randomAvatar from '../../../lib/randomAvatar'
import { Avatar, Row, Col } from 'antd'
import { Session } from 'next-auth'
import DropDownFooter from './dropdownFooter'

interface FooterProps {
  collapsed: Boolean
  onClose: any
  session?: Session | null
}

export default function MenuFooter(props: FooterProps) {
  const memoizedAvatar = useMemo(() => randomAvatar(), [])
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
            <Avatar size={36} src={memoizedAvatar} />
          </a>
        </Link>
      </Col>
    </Row>
  )
}
