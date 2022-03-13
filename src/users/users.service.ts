import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { compare } from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { JwtService } from './../jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { MailService } from './../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    //check email already taken
    try {
      const exists = await this.users.findOne({ email });
      if (exists) {
        return { ok: false, error: 'there is a user with that email already' };
      }
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );
      const verification = await this.verifications.save(
        this.verifications.create({
          user,
        }),
      );
      this.mailService.sendVerificationEmail(user.email, verification.code);

      return { ok: true };
    } catch (e) {
      return { ok: false, error: "Couldn't create account" };
    }

    //create user & hash the password
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne(
        { email },
        { select: ['password', 'id'] },
      );
      if (!user) {
        return { ok: false, error: 'User does not exist' };
      }

      const matchPassword = compare(password, user.password);
      if (!matchPassword) {
        return { ok: false, error: 'Not Authorized' };
      } else {
        const token = this.jwtService.sign(user.id);
        return { ok: true, token };
      }
    } catch (e) {
      console.error(e);
      return { ok: false, error: "Couldn't Login" };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOne({ id });
      if (user) {
        return { ok: true, user };
      }
    } catch (error) {
      return { ok: false, error: 'User not found' };
    }
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.users.findOne({ id: userId });
      if (email) {
        user.email = email;
        user.verified = false;
        const verification = await this.verifications.save(
          this.verifications.create({ user }),
        );
        this.mailService.sendVerificationEmail(user.email, verification.code);
      }
      if (password) {
        user.password = password;
      }
      await this.users.save(user);

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not update profile' };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const { user } = await this.verifications.findOne(
        { code },
        { relations: ['user'] },
      );

      if (user) {
        user.verified = true;
        this.users.save(user);
        await this.verifications.delete({ code });

        return { ok: true };
      }
      return { ok: false, error: 'Verification not found' };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
