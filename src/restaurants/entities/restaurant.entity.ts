import { Field, ObjectType, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

//graphql 관점에서 어떻게 생겼는지 묘사
@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field((type) => Number)
  @IsNumber()
  id: number;

  //should return string
  @Column()
  @Field((type) => String)
  @IsString()
  @Length(5)
  name: string;

  //for the graphql
  @Field((type) => Boolean, { defaultValue: true })
  //for the DB
  @Column({ default: true })
  //for the dto validation, can send or not
  @IsOptional()
  @IsBoolean()
  isVegan: boolean;

  @Field((type) => String)
  @Column()
  @IsString()
  address: string;

  @Field((type) => String)
  @Column()
  @IsString()
  ownerName: string;

  @Field((type) => String)
  @Column()
  @IsString()
  categoryName: string;
}
