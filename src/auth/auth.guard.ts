import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../users/entities/user.entity';
import { AllowedRoles } from './role.decorator';
import { JwtService } from './../jwt/jwt.service';
import { UsersService } from './../users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  //if true keep going, false
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );

    //not set @Role decorator(), not public
    if (!roles) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context).getContext();
    const token = gqlContext.token;

    if (token) {
      const decoded = this.jwtService.verify(token.toString());
      if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
        const { user } = await this.usersService.findById(decoded['id']);
        if (!user) {
          return false;
        }

        //user를 찾았으면, user를 gqlContext에 등록,
        //AuthUser에서 context를 사용
        gqlContext['user'] = user;

        //로그인은 되어 있는데, 누구나 가능한 경우
        if (roles.includes('Any')) {
          return true;
        }
        //roles : 시스템이 요구하는 롤
        //user.role : 유저의 실제 롤
        return roles.includes(user.role);
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
}
