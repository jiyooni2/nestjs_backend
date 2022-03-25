import { InputType, PartialType, ObjectType, Field } from '@nestjs/graphql';
import { CreateRestaurantInput } from './create-restaurant.dto';
import { CoreOutput } from './../../common/dtos/output.dto';

@InputType()
export class EditRestaurantInput extends PartialType(CreateRestaurantInput) {
  @Field((type) => Number)
  restaurantId: number;
}
// export class EditRestaurantInput extends PartialType(
//     PickType(Restaurant,["address","name","coverImage"])
// ){
//     @Field(type=>String)
//     categoryName:string;
// }

@ObjectType()
export class EditRestaurantOutput extends CoreOutput {}
