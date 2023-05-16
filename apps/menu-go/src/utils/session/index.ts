import { Session } from 'next-auth'

export const redirect = (session: Session | null) => {
    if (!session) {
        return {
          redirect: {
            destination: '/',
            permanent: false,
          },
        }
      }
}