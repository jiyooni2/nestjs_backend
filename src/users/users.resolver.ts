import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import {
  CreateAccountOutput,
  CreateAccountInput,
} from './dtos/create-account.dto';
import { LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { LoginInput } from './dtos/login.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from './../auth/auth.guard';
import { AuthUser } from 'src/auth/auth-user.decorator';

@Resolver((of) => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query((returns) => Boolean)
  hi() {
    return true;
  }

  @Mutation((returns) => CreateAccountOutput)
  async createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    try {
      //don't have to await, automatically wait for complete

      return this.usersService.createAccount(createAccountInput);
    } catch (error) {
      return { error, ok: false };
    }
  }

  @Mutation((returns) => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    try {
      //don't have to await, automatically wait for complete
      return this.usersService.login(loginInput);
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }

  @Query((returns) => User)
  me(@AuthUser() authUser: User): User {
    return authUser;
  }
}
