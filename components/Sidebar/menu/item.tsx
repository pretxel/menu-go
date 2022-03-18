import React, { useEffect, useState } from 'react'
// import { useLocation, Link } from 'react-router-dom'
import Link from 'next/link'
import { Menu } from 'antd'
import navigation from './navigation'

const { SubMenu } = Menu

interface ItemProps {
  onClose: any
}

export default function MenuItem(props: ItemProps) {
  const { onClose } = props
  const [pathname, setPathname] = useState('')

  useEffect(() => {
    setPathname(window.location.href)
  }, [])

  const splitLocation = pathname.split('/')

  // Menu
  const splitLocationUrl =
    splitLocation[splitLocation.length - 2] +
    '/' +
    splitLocation[splitLocation.length - 1]

  const menuItem = navigation.map((item, index) => {
    if (item.header) {
      return <Menu.ItemGroup key={index} title={item.header}></Menu.ItemGroup>
    }

    if (item.children) {
      return (
        <SubMenu key={item.id} icon={item.icon} title={item.title}>
          {item.children.map((childrens) => {
            if (!childrens.children) {
              const childrenNavLink = childrens.navLink.split('/')

              return (
                // Level 2
                <Menu.Item
                  key={childrens.id}
                  className={
                    splitLocationUrl ===
                    childrenNavLink[childrenNavLink.length - 2] +
                      '/' +
                      childrenNavLink[childrenNavLink.length - 1]
                      ? 'ant-menu-item-selected'
                      : 'ant-menu-item-selected-in-active'
                  }
                  onClick={onClose}
                >
                  <Link href={childrens.navLink}>{childrens.title}</Link>
                </Menu.Item>
              )
            } else {
              return (
                // Level 3
                <SubMenu key={childrens.id} title={childrens.title}>
                  {childrens.children.map((childItem) => {
                    const childrenItemLink = childItem.navLink.split('/')

                    return (
                      <Menu.Item
                        key={childItem.id}
                        className={
                          splitLocationUrl ===
                          childrenItemLink[childrenItemLink.length - 2] +
                            '/' +
                            childrenItemLink[childrenItemLink.length - 1]
                            ? 'ant-menu-item-selected'
                            : 'ant-menu-item-selected-in-active'
                        }
                        onClick={onClose}
                      >
                        <Link href={childItem.navLink}>{childItem.title}</Link>
                      </Menu.Item>
                    )
                  })}
                </SubMenu>
              )
            }
          })}
        </SubMenu>
      )
    }

    if (item.navLink) {
      const itemNavLink = item?.navLink.split('/')
      return (
        // Level 1
        <Menu.Item
          key={item.id}
          icon={item.icon}
          onClick={onClose}
          className={
            splitLocation[splitLocation.length - 2] +
              '/' +
              splitLocation[splitLocation.length - 1] ===
            itemNavLink[itemNavLink.length - 2] +
              '/' +
              itemNavLink[itemNavLink.length - 1]
              ? 'ant-menu-item-selected'
              : 'ant-menu-item-selected-in-active'
          }
        >
          <Link href={item.navLink}>{item.title}</Link>
        </Menu.Item>
      )
    }
  })
  const firstOpenKey =
    splitLocation.length === 5 ? splitLocation[splitLocation.length - 3] : ''
  return (
    <Menu
      mode="inline"
      defaultOpenKeys={[firstOpenKey, splitLocation[splitLocation.length - 2]]}
      theme={'light'}
    >
      {menuItem}
    </Menu>
  )
}
