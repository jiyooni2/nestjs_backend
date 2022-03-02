import { Module } from '@nestjs/common';
import { RestaurantResolver } from './restaurants.reolver';

@Module({
  providers: [RestaurantResolver],
})
export class RestaurantsModule {}
