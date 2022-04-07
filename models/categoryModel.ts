import { Dish } from './dishModel'

export interface Category {
  id: string
  name: string
  description: string
  dishes: Array<Dish>
}
