import { Mutation, Resolver, Args, Subscription } from '@nestjs/graphql';
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
import { PubSub } from 'graphql-subscriptions';
import { Inject } from '@nestjs/common';
import { PUB_SUB } from 'src/common/common.constants';

@Resolver((of) => Order)
export class OrderResolver {
  constructor(
    private readonly ordersService: OrdersService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

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

  @Mutation((returns) => Boolean)
  async triggerAnything(@Args('id') id: number) {
    await this.pubSub.publish('anything', { orderSubscription: `ready ${id}` });
    return true;
  }

  @Subscription((returns) => String, {
    filter: (payload, variables, context) => {
      return payload.orderSubscription === `ready ${variables.id}`;
    },
  })
  @Role(['Any'])
  orderSubscription(@AuthUser() user: User, @Args('id') id: number) {
    console.log(user);
    return this.pubSub.asyncIterator('anything');
  }
}
