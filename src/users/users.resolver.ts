import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
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
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dtos/verify-email.dto';
import { Role } from '../auth/role.decorator';

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
    return this.usersService.createAccount(createAccountInput);
  }

  @Mutation((returns) => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    //don't have to await, automatically wait for complete
    return this.usersService.login(loginInput);
  }

  @Query((returns) => User)
  @Role(['Any'])
  me(@AuthUser() authUser: User): User {
    return authUser;
  }

  @Query((returns) => UserProfileOutput)
  @Role(['Any'])
  async userProfile(
    @Args() { userId }: UserProfileInput,
  ): Promise<UserProfileOutput> {
    return this.usersService.findById(userId);
  }

  @Mutation((returns) => EditProfileOutput)
  @Role(['Any'])
  async editProfile(
    @AuthUser() authUser: User,
    @Args('input') editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    return this.usersService.editProfile(authUser.id, editProfileInput);
  }

  @Mutation((returns) => VerifyEmailOutput)
  async verifyEmail(
    @Args('input') { code }: VerifyEmailInput,
  ): Promise<VerifyEmailOutput> {
    return this.usersService.verifyEmail(code);
  }
}
