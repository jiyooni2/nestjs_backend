import { InputType, OmitType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';

//input 하고자 하는 data의 type
@InputType()
export class CreateRestaurantDto extends OmitType(Restaurant, ['id']) {}
