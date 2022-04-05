import { signOut } from 'next-auth/react'

import randomAvatar from '../../lib/randomAvatar'
import Link from 'next/link'
import { Session } from 'next-auth'
import { Dropdown, Col, Avatar, Divider } from 'antd'
import { useMemo } from 'react'

interface ContextSession {
  session: Session | null
}

export default function HeaderUser({ session }: ContextSession) {
  const memoizedAvatar = useMemo(() => randomAvatar(), [])
  const menu = (
    <div
      className="hp-border-radius hp-border-1 hp-border-color-black-40 hp-bg-black-0 hp-bg-dark-100 hp-border-color-dark-80 hp-p-24 hp-mt-12"
      style={{ width: 260 }}
    >
      <span className="hp-d-block h5 hp-text-color-black-100 hp-text-color-dark-0 hp-mb-8">
        {session?.user?.name}
      </span>

      <Link href={`/pages/profile/personel-information`}>View Profile</Link>

      <Divider className="hp-mb-16 hp-mt-6" />

      <Link href="/" passHref>
        <a className="hp-p1-body" onClick={() => signOut()}>
          Log Out
        </a>
      </Link>
    </div>
  )

  return (
    <Col>
      <Dropdown overlay={menu} placement="bottomLeft">
        <Avatar src={memoizedAvatar} size={40} className="hp-cursor-pointer" />
      </Dropdown>
    </Col>
  )
}
