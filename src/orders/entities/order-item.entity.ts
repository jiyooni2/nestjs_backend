import { InputType, ObjectType, Field } from '@nestjs/graphql';
import { Dish } from '../../restaurants/entities/dish.entity';
import { Entity, Column, ManyToOne } from 'typeorm';
import { CoreEntity } from './../../common/entities/core.entity';
import {
  DishOption,
  DishChoice,
} from './../../restaurants/entities/dish.entity';

@InputType('OrderItemOptionInputType', { isAbstract: true })
@ObjectType()
export class OrderItemOption {
  @Field((type) => String)
  name: string;

  @Field((type) => String, { nullable: true })
  choice?: String;
}

@InputType('OrderItemInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderItem extends CoreEntity {
  @ManyToOne((type) => Dish, { nullable: true, onDelete: 'CASCADE' })
  dish: Dish;

  @Field((type) => [OrderItemOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options?: OrderItemOption[];
}
