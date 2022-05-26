import React from 'react'
import VerticalLayout from '../../../components/Layout/VerticalLayout'
import MainConfig from './mainConfig'

type Props = {}

export default function index({}: Props) {
    return (
        <VerticalLayout>
            <MainConfig />
        </VerticalLayout>
    )
}
