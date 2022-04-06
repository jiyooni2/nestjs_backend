import { InputType, PickType, Field, ObjectType } from '@nestjs/graphql';
import { Payment } from './../entities/payment.entity';
import { CoreOutput } from './../../common/dtos/output.dto';

@InputType()
export class CreatePaymentInput extends PickType(Payment, [
  'transactionId',
  'restaurantId',
]) {}

@ObjectType()
export class CreatePaymentOutput extends CoreOutput {}
