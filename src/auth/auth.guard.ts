import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../users/entities/user.entity';
import { AllowedRoles } from './role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  //if true keep going, false
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );

    //not set @Role decorator(), not public
    if (!roles) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user: User = gqlContext['user'];

    if (!user) {
      return false;
    }
    //로그인은 되어 있는데, 누구나 가능한 경우
    if (roles.includes('Any')) {
      return true;
    }
    //roles : 시스템이 요구하는 롤
    //user.role : 유저의 실제 롤
    return roles.includes(user.role);
  }
}
