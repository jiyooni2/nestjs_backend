import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import {
  CREATE_ACCOUNT_DUPLICATED_EMAIL,
  LOGIN_PASSWORD_NOT_MATCH,
} from 'src/users/users.error.msg';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './../src/users/entities/user.entity';
import {
  USER_NOT_EXIST,
  VERIFICATION_NOT_EXIST,
} from './../src/users/users.error.msg';
import { Verification } from './../src/users/entities/verification.entity';

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRAPHQL_ENDPOINT = '/graphql';
const testUser = {
  email: 'cc@naver.com',
  password: '12',
};

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let jwtToken: String;
  let usersRepository: Repository<User>;
  let verificationRepository: Repository<Verification>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    await app.close();
  });

  describe('createAccount', () => {
    it('should create account', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation{
            createAccount(input:{
              email:"${testUser.email}",
              password:"${testUser.password}",
              role:Owner})
            {
              ok
              error
            }
          }`,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });
    it('should fail if account already exists', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation{
            createAccount(input:{
              email:"${testUser.email}",
              password:"${testUser.password}",
              role:Owner})
            {
              ok
              error
            }
          }`,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(false);
          expect(res.body.data.createAccount.error).toBe(
            CREATE_ACCOUNT_DUPLICATED_EMAIL,
          );
        });
    });
  });

  describe('login', () => {
    it('should login', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation{
            login(input:
            {
              email:"${testUser.email}",
              password:"${testUser.password}"
            }){
              ok
              error
              token
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.login.ok).toBe(true);
          expect(res.body.data.login.error).toBe(null);
          expect(res.body.data.login.token).toEqual(expect.any(String));
          jwtToken = res.body.data.login.token;
        });
    });
    it('should not login with wrong credentials', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
        mutation{
          login(input:
          {
            email:"${testUser.email}",
            password:"wrong${testUser.password}"
          }){
            ok
            error
            token
          }
        }
      `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.login.ok).toBe(false);
          expect(res.body.data.login.error).toBe(LOGIN_PASSWORD_NOT_MATCH);
          expect(res.body.data.login.token).toBe(null);
        });
    });
  });
  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });
    it('should find user', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set({
          'x-jwt': `${jwtToken}`,
        })
        .send({
          query: `
        query{
          userProfile(userId:${userId})
          {
            ok
            error
            user{
              id
            }
          }
        }`,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.userProfile.ok).toBe(true);
          expect(res.body.data.userProfile.error).toBe(null);
          expect(res.body.data.userProfile.user.id).toBe(1);
        });
    });
    it('should not find a user', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set({
          'x-jwt': `${jwtToken}`,
        })
        .send({
          query: `
        query{
          userProfile(userId:999)
          {
            ok
            error
            user{
              id
            }
          }
        }`,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.userProfile.ok).toBe(false);
          expect(res.body.data.userProfile.error).toBe(USER_NOT_EXIST);
          expect(res.body.data.userProfile.user).toBe(null);
        });
    });
  });

  describe('me', () => {
    it('should find my profile', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set({ 'X-JWT': `${jwtToken}` })
        .send({
          query: `
          query{
            me{
              email
            }
          }
          `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.me.email).toBe(testUser.email);
        });
    });

    it('should not find my profile', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          query{
            me{
              email
            }
          }
          `,
        })
        .expect(200)
        .expect((res) => {
          const [error] = res.body.errors;
          expect(error.message).toBe('Forbidden resource');
        });
    });
  });

  describe('editProfile', () => {
    const NEW_EMAIL = 'edit@naver.com';
    it('should change email', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', `${jwtToken}`)
        .send({
          query: `
        mutation{
          editProfile(input:{email:"${NEW_EMAIL}"})
          {
            ok
            error
          }
        }`,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.editProfile.ok).toBe(true);
          expect(res.body.data.editProfile.error).toBe(null);
        });
    });

    it('should have new email', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set({ 'X-JWT': `${jwtToken}` })
        .send({
          query: `
          query{
            me{
              email
            }
          }
          `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.me.email).toBe(NEW_EMAIL);
        });
    });
  });

  describe('verifyEmail', () => {
    let code: string;
    beforeAll(async () => {
      const [verification] = await verificationRepository.find();
      code = verification.code;
    });
    it('should verify email', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
        mutation{
          verifyEmail(input:{code:"${code}"})
          {
            ok
            error
          }
        }`,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.verifyEmail.ok).toBe(true);
          expect(res.body.data.verifyEmail.error).toBe(null);
        });
    });
    it('should fail on wrong verification code', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
        mutation{
          verifyEmail(input:{code:"xxxxxx"})
          {
            ok
            error
          }
        }`,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.verifyEmail.ok).toBe(false);
          expect(res.body.data.verifyEmail.error).toBe(VERIFICATION_NOT_EXIST);
        });
    });
  });
});
