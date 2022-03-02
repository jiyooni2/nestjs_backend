import { Field, ObjectType } from '@nestjs/graphql';

//graphql 관점에서 어떻게 생겼는지 묘사
@ObjectType()
export class Restaurant {
  //should return string
  @Field((type) => String)
  name: string;

  @Field((type) => Boolean, { nullable: true })
  isVegan?: boolean;

  @Field((type) => String)
  address: string;

  @Field((type) => String)
  ownerName: string;
}
