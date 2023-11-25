import faker from '@faker-js/faker'

import { Dish } from '../models'

export const GenerateDishes = (itemMax: number): Array<Dish> => {
  const dishesArray:Dish[] = []
  for (let i = 0; i < itemMax; i += 1) {
    dishesArray.push({
      id: faker.datatype.uuid(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      photo: faker.image.imageUrl(),
      price: parseFloat(faker.commerce.price()),
    })
  }
  return dishesArray
}
