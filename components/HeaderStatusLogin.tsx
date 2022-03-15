import Link from 'next/link'
import { Button } from 'antd'
import { Skeleton } from 'antd'
import { useSession } from 'next-auth/react'
// import { useRouter } from 'next/router'
import HeaderUser from './Header/HeaderUser'
import { Session } from 'next-auth'

interface ContextSession {
  data: Session | null
  status: string
}

export default function HeaderStatusLogin() {
  const { data: session, status }: ContextSession = useSession()

  const loginButton = (
    <Button
      type="primary"
      className="hp-px-sm-16 hp-py-sm-8 hp-px-32 hp-py-16 hp-ml-sm-0 hp-ml-8"
    >
      <Link href="/auth/login" passHref>
        Login
      </Link>
    </Button>
  )
  const signUpButton = (
    <Button
      type="text"
      className="hp-px-sm-16 hp-py-sm-8 hp-px-32 hp-py-16 hp-ml-sm-8 hp-text-color-black-80 hp-text-color-dark-30"
    >
      <Link href="/auth/register" passHref>
        Sign Up
      </Link>
    </Button>
  )
  if (status === 'loading')
    return (
      <div style={{ height: '50px', width: '50px' }}>
        <Skeleton loading={true} active avatar />
      </div>
    )
  if (status === 'unauthenticated' || session == null)
    return (
      <>
        {signUpButton}
        {loginButton}
      </>
    )
  if (status === 'authenticated' && session) {
    return <HeaderUser session={session} />
  }

  return null
}
