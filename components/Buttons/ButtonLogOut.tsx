import React from 'react'
import { Button } from 'antd'
import { signOut } from 'next-auth/react'

type Props = {}

export default function ButtonLogOut({}: Props) {
  return (
    <>
      <Button
        className="hp-btn-gradient hp-btn-gradient-secondary hp-mr-16 hp-mb-16"
        onClick={() => signOut()}
        style={{
          background: 'red',
          color: 'white',
          height: '30px',
          width: '100px',
        }}
      >
        signOut
      </Button>
    </>
  )
}
