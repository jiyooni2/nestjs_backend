import { Module } from '@nestjs/common';
import { RestaurantResolver } from './restaurants.reolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantsService } from './restaurants.service';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant])],
  providers: [RestaurantsService, RestaurantResolver],
})
export class RestaurantsModule {}
