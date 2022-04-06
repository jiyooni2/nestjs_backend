import { Module } from '@nestjs/common';
import { PaymentsResolver } from './payment.resolver';
import { PaymentsService } from './payments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Restaurant } from './../restaurants/entities/restaurant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Restaurant])],
  providers: [PaymentsService, PaymentsResolver],
})
export class PaymentsModule {}
