import React from 'react'
import VerticalLayout from '../../../components/Layout/VerticalLayout'
import MainCateogory from './mainCategory'

type Props = {}

export default function index({}: Props) {
  return (
    <VerticalLayout>
      <MainCateogory />
    </VerticalLayout>
  )
}
