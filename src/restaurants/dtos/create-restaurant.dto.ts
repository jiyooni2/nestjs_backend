import { ArgsType, Field } from '@nestjs/graphql';
import { IsBoolean, IsString, Length } from 'class-validator';

//input 하고자 하는 data의 type
@ArgsType()
export class CreateRestaurantDto {
  @Field((returns) => String)
  @IsString()
  @Length(3)
  name: string;

  @Field((returns) => Boolean, { nullable: true })
  @IsBoolean()
  isVegan?: boolean;

  @Field((returns) => String)
  @IsString()
  address: string;

  @Field((returns) => String)
  @IsString()
  ownerName: string;
}
