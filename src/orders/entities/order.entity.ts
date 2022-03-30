import { CoreEntity } from './../../common/entities/core.entity';
import {
  ObjectType,
  InputType,
  Field,
  registerEnumType,
} from '@nestjs/graphql';
import { Entity, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { User } from './../../users/entities/user.entity';
import { Restaurant } from './../../restaurants/entities/restaurant.entity';
import { Dish } from './../../restaurants/entities/dish.entity';

export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  //user가 지워진다 하더라도, CASCADE 아니고 null 로 비워둠으로서 주문은 남겨둠
  @ManyToOne((type) => User, (user) => user.orders, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @Field((type) => User, { nullable: true })
  customer?: User;

  @ManyToOne((type) => User, (user) => user.rides, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @Field((type) => User, { nullable: true })
  driver?: User;

  @ManyToOne((type) => Restaurant, (restaurant) => restaurant.orders)
  @Field((type) => Restaurant)
  restaurant: Restaurant;

  @ManyToMany((type) => Dish, (dish) => dish.orders)
  @Field((type) => [Dish])
  @JoinTable()
  dishes: Dish[];

  @Column()
  @Field((type) => Number)
  total: number;

  @Column({ type: 'enum', enum: OrderStatus })
  @Field((type) => OrderStatus)
  status: OrderStatus;
}
