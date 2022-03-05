import { Drawer } from 'antd'
import { RiCloseFill } from 'react-icons/ri'
import Item from '../Item/Item'

interface Props {
  onClose: boolean | any
  visible: boolean
}

export default function MenuMobile({ onClose, visible }: Props) {
  return (
    <Drawer
      className="hp-mobile-sidebar"
      placement="left"
      closable={true}
      visible={visible}
      onClose={onClose}
      closeIcon={
        <RiCloseFill className="remix-icon hp-text-color-black-80" size={24} />
      }
    >
      <Item />
    </Drawer>
  )
}
