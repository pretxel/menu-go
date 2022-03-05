import { Row } from 'antd'
import { useSession } from 'next-auth/react'

type Props = {}

export default function LandingPage({}: Props) {
  const { data: session } = useSession()

  return (
    <>
      <Row justify="center">
        <h1>Welcome {session?.user?.name}</h1>
      </Row>
    </>
  )
}
