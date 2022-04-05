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
import { NEW_COOKED_ORDER, PUB_SUB } from 'src/common/common.constants';
import {
  NEW_PENDING_ORDER,
  NEW_ORDER_UPDATE,
} from './../common/common.constants';
import { OrderUpdatesInput } from './dtos/order-updates.dto';

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

  @Subscription((returns) => Order, {
    filter: ({ pendingOrders }, _, { user }) => {
      return user.id === pendingOrders.restaurant.ownerId;
    },
    resolve: ({ pendingOrders }) => {
      return pendingOrders;
    },
  })
  @Role(['Owner'])
  pendingOrders() {
    return this.pubSub.asyncIterator(NEW_PENDING_ORDER);
  }

  //driver can access to all the orders
  @Subscription((returns) => Order)
  @Role(['Delivery'])
  cookedOrders() {
    return this.pubSub.asyncIterator(NEW_COOKED_ORDER);
  }

  @Subscription((returns) => Order, {
    filter: (
      { orderUpdates: order }: { orderUpdates: Order },
      { input }: { input: OrderUpdatesInput },
      { user }: { user: User },
    ) => {
      if (
        order.driverId !== user.id &&
        order.customerId !== user.id &&
        order.restaurant.ownerId !== user.id
      ) {
        return false;
      }
      return order.id === input.id;
    },
  })
  @Role(['Any'])
  orderUpdates(@Args('input') orderUpdatesInput: OrderUpdatesInput) {
    return this.pubSub.asyncIterator(NEW_ORDER_UPDATE);
  }
}
