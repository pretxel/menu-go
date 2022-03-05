import { Skeleton } from 'antd'
import { useSession } from 'next-auth/react'
// import { useRouter } from 'next/router'
import ButtonLogin from './Buttons/ButtonLogin'
import HeaderUser from './Header/HeaderUser'

export default function RedirectLogin() {
  const { data: session, status } = useSession()
  console.log(session && session.user, 'SESSIOOOsssN')

  if (status === 'loading')
    return (
      <div style={{ height: '50px', width: '50px' }}>
        <Skeleton loading={true} active avatar />
      </div>
    )
  if (status === 'unauthenticated' || session == null) return <ButtonLogin />
  if (status === 'authenticated') return <HeaderUser user={session.user} />
  // if (session.user != null)

  return null
}
