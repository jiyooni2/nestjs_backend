import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from './../jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { MailService } from './../mail/mail.service';
import {
  CREATE_ACCOUNT_DUPLICATED_EMAIL,
  CREATE_ACCOUNT_FAIL,
  USER_NOT_EXIST,
  LOGIN_FAIL,
  LOGIN_PASSWORD_NOT_MATCH,
  EDIT_PROFILE_FAIL,
  VERIFICATION_FAIL,
  VERIFICATION_NOT_EXIST,
} from './users.error.msg';

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
        return { ok: false, error: CREATE_ACCOUNT_DUPLICATED_EMAIL };
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
      return { ok: false, error: CREATE_ACCOUNT_FAIL };
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
        return { ok: false, error: USER_NOT_EXIST };
      }

      const matchPassword = await user.checkPassword(password, user.password);
      if (!matchPassword) {
        return { ok: false, error: LOGIN_PASSWORD_NOT_MATCH };
      } else {
        const token = this.jwtService.sign(user.id);
        return { ok: true, token };
      }
    } catch (e) {
      console.error(e);
      return { ok: false, error: LOGIN_FAIL };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOneOrFail({ id });

      return { ok: true, user };
    } catch (error) {
      return { ok: false, error: USER_NOT_EXIST };
    }
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.users.findOne({ id: userId });
      if (email) {
        const exists = await this.users.findOne({ email }, { select: ['id'] });
        if (exists) {
          return { ok: false, error: 'Already taken email' };
        }

        user.email = email;
        user.verified = false;
        await this.verifications.delete({ user: { id: user.id } });
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
      return { ok: false, error: EDIT_PROFILE_FAIL };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verifications.findOne(
        { code },
        { relations: ['user'] },
      );

      if (verification) {
        verification.user.verified = true;
        await this.users.save(verification.user);
        await this.verifications.delete({ code });

        return { ok: true };
      }
      return { ok: false, error: VERIFICATION_NOT_EXIST };
    } catch (error) {
      return { ok: false, error: VERIFICATION_FAIL };
    }
  }
}
