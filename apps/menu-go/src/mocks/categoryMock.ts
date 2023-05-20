import faker from "@faker-js/faker";

import { Category } from "../models";
import { GenerateDishes } from "./dishMock";

export const GenerateCategories = (itemMax: number): Array<Category> => {
  const categoriesArray = [];
  for (let i = 0; i < itemMax; i += 1) {
    categoriesArray.push({
      id: faker.datatype.uuid(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      dishes: GenerateDishes(5),
    });
  }
  return categoriesArray;
};
