import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';

//resolver of Restaurant entity
@Resolver()
export class RestaurantResolver {
  //Query(return type)
  @Query((returns) => Boolean)
  isGood(): Boolean {
    return true;
  }

  @Query((returns) => [Restaurant])
  isMine(@Args('veganOnly') veganOnly: Boolean): Restaurant[] {
    if (veganOnly) {
      return [];
    } else {
      return [];
    }
  }

  @Mutation((returns) => Boolean)
  createRestaurant(@Args() data: CreateRestaurantDto): Boolean {
    console.log(data);
    return true;
  }
}
