import { Col, Avatar, Row, Typography, Button } from 'antd'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import randomAvatar from '../../lib/randomAvatar'
import type { Session } from 'next-auth'

export default function HeaderUser({ user }: Session) {
  const avatarImg = randomAvatar()
  const { Text } = Typography
  const logOutButton = (
    <Button
      type="text"
      className="hp-px-sm-16 hp-py-sm-8 hp-px-32 hp-py-16 hp-ml-sm-8 hp-text-color-black-80 hp-text-color-dark-30"
      onClick={() => signOut()}
    >
      <Link href="/auth/register" passHref>
        Log Out
      </Link>
    </Button>
  )

  return (
    <Row justify="center" align="middle">
      <Col>
        {logOutButton}
        <Text>{user && user.name}</Text>
      </Col>
      <Col style={{ marginLeft: '8px' }}>
        <Avatar src={avatarImg} size={40} className="hp-cursor-pointer" />
      </Col>
    </Row>
  )
}
