import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, Length, MaxLength } from 'class-validator';
import { Order } from '../../orders/entities/order.entity';
import { Column, Entity, ManyToMany, ManyToOne, RelationId } from 'typeorm';
import { CoreEntity } from './../../common/entities/core.entity';
import { Restaurant } from './restaurant.entity';

@InputType('DishChoiceInputType', { isAbstract: true })
@ObjectType()
class DishChoice {
  @Field((type) => String)
  name: string;

  @Field((type) => Number, { nullable: true })
  extra?: number;
}

@InputType('DishOptionInputType', { isAbstract: true })
@ObjectType()
class DishOption {
  //맛, 만약 고기추가 이런거라면 초이스가 없이 가격만 늘어나겠지
  //사이즈라면, DishChoice에 L : extra 2000 XL : extra 5000 등등...
  @Field((type) => String)
  name: string;

  //초코맛, 딸기맛 등등, 가격추가가 없을 수도 있겠지
  @Field((type) => [String], { nullable: true })
  choices?: DishChoice[];

  @Field((type) => Number, { nullable: true })
  extra?: number;
}

@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
  @Field((type) => String)
  @Column()
  @IsString()
  @Length(5)
  name: string;

  @Field((type) => Number)
  @Column()
  @IsNumber()
  price: number;

  @Field((type) => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  photo?: string;

  @Field((type) => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  @Length(0, 140)
  description?: string;

  @Field((type) => Restaurant)
  @ManyToOne((type) => Restaurant, (restaurant) => restaurant.menu, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;

  @Field((type) => [DishOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options?: DishOption[];

  @ManyToMany((type) => Order, (order) => order.dishes)
  @Field((type) => [Order])
  orders: [Order];
}
