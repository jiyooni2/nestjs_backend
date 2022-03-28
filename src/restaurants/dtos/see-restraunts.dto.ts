import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  PaginationInput,
  PaginationOutput,
} from './../../common/dtos/pagination.dto';
import { Restaurant } from './../entities/restaurant.entity';

@InputType()
export class SeeRestaurantsInput extends PaginationInput {}

@ObjectType()
export class SeeRestaurantsOutput extends PaginationOutput {
  @Field((type) => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
