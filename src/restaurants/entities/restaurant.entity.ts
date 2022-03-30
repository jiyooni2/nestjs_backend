import { Field, ObjectType, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { CoreEntity } from './../../common/entities/core.entity';
import { Category } from './category.entity';
import { User } from './../../users/entities/user.entity';
import { Dish } from './dish.entity';
import { Order } from '../../orders/entities/order.entity';

//graphql 관점에서 어떻게 생겼는지 묘사
@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
  //for the DB,typeORM
  @Column()
  //for the graphql
  @Field((type) => String)
  //for the dto validation, can send or not
  @IsString()
  @Length(5)
  name: string;

  @Field((type) => String)
  @Column()
  @IsString()
  coverImage: string;

  @Field((type) => String)
  @Column()
  @IsString()
  address: string;

  @ManyToOne((type) => User, (user) => user.restaurants, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @Field((type) => User)
  owner: User;

  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  @ManyToOne((type) => Category, (category) => category.restaurants, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @Field((type) => Category, { nullable: true })
  category: Category;

  @OneToMany((type) => Dish, (dish) => dish.restaurant, {
    nullable: true,
  })
  @Field((type) => [Dish])
  menu: Dish[];

  @OneToMany((type) => Order, (order) => order.restaurant)
  @Field((type) => [Order])
  orders: Order[];
}
