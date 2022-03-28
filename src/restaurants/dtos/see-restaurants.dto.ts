import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Restaurant } from './../entities/restaurant.entity';
import { CoreOutput } from './../../common/dtos/output.dto';

@InputType()
export class SeeRestaurantInput {
  @Field((type) => Number)
  restaurantId: number;
}

@ObjectType()
export class SeeRestaurantOutput extends CoreOutput {
  @Field((type) => Restaurant, { nullable: true })
  restaurant?: Restaurant;
}
