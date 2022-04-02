import { Mutation, Resolver, Args } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';
import { AuthUser } from './../auth/auth-user.decorator';
import { Role } from '../auth/role.decorator';
import { Query } from '@nestjs/graphql';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';

@Resolver((of) => Order)
export class OrderResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Mutation((type) => CreateOrderOutput)
  @Role(['Client'])
  createOrder(
    @AuthUser() customer: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    return this.ordersService.createOrder(customer, createOrderInput);
  }

  @Query((type) => GetOrdersOutput)
  @Role(['Any'])
  getOrders(
    @AuthUser() owner: User,
    @Args('input') getOrdersInput: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    return this.ordersService.getOrders(owner, getOrdersInput);
  }

  @Query((type) => GetOrderOutput)
  @Role(['Any'])
  getOrder(
    @AuthUser() owner: User,
    @Args('input') getOrderInput: GetOrderInput,
  ): Promise<GetOrdersOutput> {
    return this.ordersService.getOrder(owner, getOrderInput);
  }

  @Mutation((returns) => EditOrderOutput)
  @Role(['Owner', 'Delivery'])
  async editOrder(
    @AuthUser() user: User,
    @Args('input') editOrderInput: EditOrderInput,
  ): Promise<EditOrderOutput> {
    return this.ordersService.editOrder(user, editOrderInput);
  }
}
