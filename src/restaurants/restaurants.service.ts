import { Injectable } from '@nestjs/common';
import { Args } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { User } from './../users/entities/user.entity';
import { Category } from './entities/category.entity';
import { CategoryRepository } from './repositories/category.repository';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import {
  SeeRestaurantsInput,
  SeeRestaurantsOutput,
} from './dtos/see-restraunts.dto';
import {
  SeeRestaurantInput,
  SeeRestaurantOutput,
} from './dtos/see-restaurants.dto';
import {
  SearchRestaurantsInput,
  SearchRestaurantsOutput,
} from './dtos/search-restaurant.dto';
import { Raw } from 'typeorm';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { Dish } from './entities/dish.entity';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    private readonly categories: CategoryRepository,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
  ) {}

  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    //don't have to
    //create({name:CreateRestaurantInput.name,....})
    //can trust the dto
    try {
      const restaurant = await this.restaurants.findOne({
        name: createRestaurantInput.name,
      });
      if (restaurant) {
        return { ok: false, error: 'Restaurant with the name already exists' };
      }
      const newRestaurant = this.restaurants.create(createRestaurantInput);

      newRestaurant.owner = owner;
      newRestaurant.category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );

      await this.restaurants.save(newRestaurant);
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const id = editRestaurantInput.restaurantId;
      const restaurant = await this.restaurants.findOne({ id });

      if (!restaurant) {
        return { ok: false, error: 'Restaurant Not Found' };
      }

      if (owner.id !== restaurant.ownerId) {
        return { ok: false, error: 'Not Authorized' };
      }

      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }

      const newRestaurant = {
        ...restaurant,
        ...editRestaurantInput,
        ...(category && { category }),
      };
      this.restaurants.save(newRestaurant);

      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async deleteRestaurant(
    owner: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return { ok: false, error: 'Restaurant Not Found' };
      }

      if (restaurant.ownerId !== owner.id) {
        return { ok: false, error: 'Not Authorized' };
      }

      await this.restaurants.delete(restaurantId);
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return { ok: true, categories };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async restaurantCount(category: Category): Promise<number> {
    try {
      const { id } = category;

      const count = await this.categories.findOne(
        { id },
        { loadRelationIds: true, select: ['restaurants', 'id'] },
      );
      return count.restaurants.length;

      //이렇게 짜면 모든 DB를 다 뒤지지 않을까? DB의 장점을 못살릴 듯...
      //return this.restaurants.count({category});
    } catch (error) {
      return -1;
    }
  }

  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne(
        { slug },
        // { relations: ['restaurants'] },
      );
      if (!category) {
        return { ok: false, error: 'Category Not Found' };
      }

      //pagination
      const restaurants = await this.restaurants.find({
        where: {
          category,
        },
        take: 25,
        skip: (page - 1) * 25,
      });
      category.restaurants = restaurants;

      const totalResults = await this.restaurantCount(category);

      return { ok: true, category, totalPages: Math.ceil(totalResults / 25) };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async seeRestaurants({
    page,
  }: SeeRestaurantsInput): Promise<SeeRestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        take: 25,
        skip: (page - 1) * 25,
      });
      return {
        ok: true,
        restaurants,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async seeRestaurant({
    restaurantId,
  }: SeeRestaurantInput): Promise<SeeRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId, {
        relations: ['menu'],
      });
      if (!restaurant) {
        return { ok: false, error: 'Restaurant Not Found' };
      }

      return { ok: true, restaurant };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async searchRestaurants({
    query,
    page,
  }: SearchRestaurantsInput): Promise<SearchRestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        where: { name: Raw((name) => `${name} ILIKE '%${query}%'`) },
        skip: (page - 1) * 25,
        take: 25,
      });

      return {
        ok: true,
        restaurants,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        createDishInput.restaurantId,
      );
      if (!restaurant) {
        return { ok: false, error: 'Restaurant Not Found' };
      }

      if (restaurant.ownerId !== owner.id) {
        return { ok: false, error: 'Not Authorized' };
      }

      const newDish = await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );
      newDish.restaurant = restaurant;

      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishes.findOne(editDishInput.dishId, {
        relations: ['restaurant'],
      });

      if (!dish) {
        return { ok: false, error: 'Dish Not Found' };
      }

      if (dish.restaurant.ownerId !== owner.id) {
        return { ok: false, error: 'Not Authorized' };
      }

      this.dishes.save({
        id: editDishInput.dishId,
        ...editDishInput,
      });

      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishes.findOne(dishId, {
        relations: ['restaurants'],
      });

      if (!dish) {
        return { ok: false, error: 'Dish Not Found' };
      }

      if (dish.restaurant.ownerId !== owner.id) {
        return { ok: false, error: 'Not Authorized' };
      }

      await this.dishes.delete(dishId);
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
