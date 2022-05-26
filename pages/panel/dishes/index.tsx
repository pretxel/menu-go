import React from 'react'
import VerticalLayout from '../../../components/Layout/VerticalLayout'
import MainDishes from './mainDishes'

type Props = {}

export default function index({}: Props) {
    return (
        <VerticalLayout>
            <MainDishes />
        </VerticalLayout>
    )
}
