export interface NavigationItemLv2 {
  id: string
  title: string
  navLink: string
}

export interface NavigationItemLv1 {
  id: string
  title: string
  navLink: string
  children?: [NavigationItemLv2]
}

export interface NavigationItem {
  header?: string
  id?: string
  title?: string
  navLink?: string
  icon?: string
  children?: [NavigationItemLv1]
}

const config: Array<NavigationItem> = [
  {
    id: 'config',
    title: 'Config',
    navLink: '/panel/config',
  },
  {
    id: 'dishes',
    title: 'Dishes',
    navLink: '/panel/dishes',
  },
  {
    id: 'category',
    title: 'Category',
    navLink: '/panel/category',
  },
]

const navigation = [...config]

export default navigation
