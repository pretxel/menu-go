import Link from 'next/link'
import { MdLogin } from 'react-icons/md'
import { Row, Typography } from 'antd'
interface Props {}
const { Text } = Typography
export default function ButtonLogin({}: Props) {
  const stylesIcon = {
    size: '20px',
    fill: '#000',
    color: '#000',
  }
  return (
    <>
      <Link href="auth/login" passHref>
        <Row
          style={{
            cursor: 'pointer',
          }}
          gutter={[8, 8]}
          justify="center"
          align="middle"
        >
          <MdLogin
            {...stylesIcon}
            style={{ zIndex: '2', paddingRight: '5px' }}
          />

          <Text>Login</Text>
        </Row>
      </Link>
    </>
  )
}
