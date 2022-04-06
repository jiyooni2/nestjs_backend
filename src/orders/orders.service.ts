import { flatten, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Restaurant } from './../restaurants/entities/restaurant.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { OrderItem } from './entities/order-item.entity';
import { Dish } from '../restaurants/entities/dish.entity';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { NEW_COOKED_ORDER, PUB_SUB } from '../common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import {
  NEW_PENDING_ORDER,
  NEW_ORDER_UPDATE,
} from './../common/common.constants';
import { TakeOrderInput, TakeOrderOutput } from './dtos/taker-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);

      if (!restaurant) {
        return { ok: false, error: 'Restaurant Not Found' };
      }

      let total = 0;
      let orderItemsList: OrderItem[] = [];

      for (const item of items) {
        const dish = await this.dishes.findOne(item.dishId);
        if (!dish) {
          return { ok: false, error: 'Dish Not Found' };
        }

        let dishFinalPrice = dish.price;

        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            (dishOption) => dishOption.name === itemOption.name,
          );
          if (dishOption) {
            if (dishOption.extra) {
              dishFinalPrice += dishOption.extra;
            }
          }

          if (dishOption.choices) {
            const dishOptionChoice = dishOption.choices.find(
              (choice) => choice.name === itemOption.choice,
            );
            if (dishOptionChoice) {
              if (dishOptionChoice.extra) {
                dishFinalPrice += dishOptionChoice.extra;
              }
            }
          }
        }

        total += dishFinalPrice;
        const orderItem = await this.orderItems.save(
          this.orderItems.create({
            dish,
            options: item.options,
          }),
        );
        orderItemsList.push(orderItem);
      }

      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total,
          items: orderItemsList,
        }),
      );
      order.restaurant.ownerId = restaurant.ownerId;

      //NEW_PENDING_ORDER event 발생
      //pendingOrders의 결과로 order를 받을 수 있게 넘겨줌
      await this.pubSub.publish(NEW_PENDING_ORDER, {
        pendingOrders: order,
      });

      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async getOrders(
    user: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];

      if (user.role === UserRole.Client) {
        orders = await this.orders.find({
          where: {
            customer: user,
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({
          where: {
            driver: user,
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.Owner) {
        const restaurants = await this.restaurants.find({
          where: { owner: User },
          relations: ['orders'],
        });

        orders = restaurants.map((restaurant) => restaurant.orders).flat(1);
        if (status) {
          orders = orders.filter((order) => order.status === status);
        }
      }

      return { ok: true, orders };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId, {
        relations: ['restaurant'],
      });

      if (!order) {
        return { ok: false, error: 'Order Not Found' };
      }

      if (!this.canSeeOrder(user, order)) {
        return { ok: false, error: 'Not Authorized' };
      }

      return { ok: true, order };
    } catch (error) {
      return { ok: false, error };
    }
  }

  canSeeOrder(user: User, order: Order): boolean {
    let canSee = true;

    if (user.role === UserRole.Client && order.customerId !== user.id) {
      canSee = false;
    } else if (user.role === UserRole.Delivery && order.driverId !== user.id) {
      canSee = false;
    } else if (
      user.role === UserRole.Owner &&
      order.restaurant.ownerId !== user.id
    ) {
      canSee = false;
    }

    return canSee;
  }

  async editOrder(
    user: User,
    { id: orderId, status }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return { ok: false, error: 'Order Not Found' };
      }

      if (!this.canSeeOrder(user, order)) {
        return { ok: false, error: 'Not Authorized' };
      }

      if (user.role === UserRole.Owner) {
        if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
          return {
            ok: false,
            error: 'Can change the status only to cooking and cooked',
          };
        }
      } else if (user.role === UserRole.Delivery) {
        if (
          status !== OrderStatus.PickedUp &&
          status !== OrderStatus.Delivered
        ) {
          return {
            ok: false,
            error: 'Can change the status only to pickedup and delivered',
          };
        }
      }

      await this.orders.save({
        id: orderId,
        status,
      });

      const newOrder = { ...order, status };

      if (user.role === UserRole.Owner) {
        if (status === OrderStatus.Cooked) {
          await this.pubSub.publish(NEW_COOKED_ORDER, {
            cookedOrders: newOrder,
          });
        }
      }

      await this.pubSub.publish(NEW_ORDER_UPDATE, { orderUpdates: newOrder });

      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async takeOrder(
    driver: User,
    { id: orderId }: TakeOrderInput,
  ): Promise<TakeOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);

      if (!order) {
        return { ok: false, error: 'Order Not Found' };
      }

      if (order.driver) {
        return { ok: false, error: 'This order already has a driver' };
      }

      await this.orders.save({
        id: orderId,
        driver,
      });

      order.driver = driver;

      await this.pubSub.publish(NEW_ORDER_UPDATE, {
        orderUpdates: order,
      });

      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
