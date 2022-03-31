import { InputType, ObjectType, PickType, Field } from '@nestjs/graphql';
import { CoreOutput } from './../../common/dtos/output.dto';
import { Order } from '../entities/order.entity';
import { DishOption } from './../../restaurants/entities/dish.entity';
import { OrderItemOption } from '../entities/order-item.entity';

@InputType()
export class CreateOrderItemInput {
  @Field((type) => Number)
  dishId: number;

  @Field((type) => [OrderItemOption], { nullable: true })
  options?: OrderItemOption[];
}

@InputType()
export class CreateOrderInput {
  @Field((type) => Number)
  restaurantId: number;

  @Field((type) => [CreateOrderItemInput])
  items: CreateOrderItemInput[];
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {}
