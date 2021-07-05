import * as dotenv from 'dotenv';
dotenv.config({ path: 'test.env' });
import * as request from 'supertest';
import { expect } from 'chai';
import { runServer, closeServer } from '../src/main';
import { getRepository } from 'typeorm';
import { User } from '../src/entity/user';
import * as jwt from 'jsonwebtoken';
import { seedDatabase } from './../src/seed/user-seed';
import { Address } from '../src/entity/address';

let token: string = '';

function postGraphQL(queryOrMutation: string, input) {
  return request('localhost:4000')
    .post('/')
    .send({ query: queryOrMutation, variables: { data: input } })
    .set({ Authentication: token });
}

function tokenCreate() {
  return jwt.sign({ id: 51 }, process.env.JWT_SECRET, {
    expiresIn: '4h',
  });
}

before(async () => {
  await runServer();
  await seedDatabase();
});

describe('Hello world query test', () => {
  it('should return with Hello, world!', async () => {
    const query = `
      query {
        hello
      }
    `;
    token = await tokenCreate();
    const response = await postGraphQL(query, {});
    expect(response.statusCode).deep.eq(200);
    expect(response.body.data.hello).deep.eq('Hello, world!');
  });
});

describe('Create user mutation test', () => {
  const mutation = `
    mutation CreateUser($data: CreateUserInput) {
      createUser(data: $data) {
        id
        name
        email
        password
        birthDate
        addresses{
          id
          CEP
          street
          streetNumber
          neighborhood
          city
          state
          complement
        }
      }
    }
  `;

  let input: CreateUserInput;

  beforeEach(async () => {
    token = await tokenCreate();
    input = {
      name: 'Teste',
      email: 'test1@test.com',
      password: 'test123',
      birthDate: '17/09/1991',
    };
  });

  it('should fail to create user due to token not found', async () => {
    token = '';
    const response = await postGraphQL(mutation, input);
    expect(response.body.errors[0].extensions.exception.code).deep.eq(401);
    expect(response.body.errors[0].message).deep.eq('Token not found');
  });

  it('should fail to create user due to invalid token', async () => {
    token = await jwt.sign({ id: 1 }, 'invalidToken', {
      expiresIn: '4h',
    });
    const response = await postGraphQL(mutation, input);
    expect(response.body.errors[0].extensions.exception.code).deep.eq(401);
    expect(response.body.errors[0].message).deep.eq('Invalid token');
  });

  it('should create an user in the test database and return his details', async () => {
    const response = await postGraphQL(mutation, input);
    expect(response.statusCode).deep.eq(200);
    expect(response.body.data.createUser.id).to.be.a('number');
    expect(response.body.data.createUser.name).deep.eq('Teste');
    expect(response.body.data.createUser.email).deep.eq('test1@test.com');
    expect(response.body.data.createUser.birthDate).deep.eq('17/09/1991');

    const createdUser = await getRepository(User).findOne(
      {
        id: response.body.data.createUser.id,
      },
      { relations: ['addresses'] },
    );
    expect(createdUser.id).to.be.a('number');
    expect(createdUser.id).deep.eq(response.body.data.createUser.id);
    expect(createdUser.name).deep.eq('Teste');
    expect(createdUser.email).deep.eq('test1@test.com');
    expect(createdUser.birthDate).deep.eq('17/09/1991');
    expect(createdUser.password).to.be.a('String');
  });

  it('should fail to create user due to invalid e-mail', async () => {
    input.email = 'test@';
    const response = await postGraphQL(mutation, input);
    expect(response.body.errors[0].extensions.exception.code).deep.eq(400);
    expect(response.body.errors[0].message).deep.eq('E-mail inválido');
  });

  it('should fail to create user due to email already registered', async () => {
    const response = await postGraphQL(mutation, input);
    expect(response.body.errors[0].extensions.exception.code).deep.eq(409);
    expect(response.body.errors[0].message).deep.eq('E-mail ja cadastrado');
  });

  it('should fail to create user due to short password', async () => {
    input.email = 'test2@test.com';
    input.password = 'test1';
    const response = await postGraphQL(mutation, input);
    expect(response.body.errors[0].extensions.exception.code).deep.eq(400);
    expect(response.body.errors[0].message).deep.eq(
      'Senha precisa conter 7 dígitos com pelo menos uma letra e um número',
    );
  });

  it('should fail to create user due to without number password', async () => {
    input.email = 'test3@test.com';
    input.password = 'testtest';
    const response = await postGraphQL(mutation, input);
    expect(response.body.errors[0].extensions.exception.code).deep.eq(400);
    expect(response.body.errors[0].message).deep.eq(
      'Senha precisa conter 7 dígitos com pelo menos uma letra e um número',
    );
  });

  it('should fail to create user due to future date', async () => {
    input.email = 'test4@test.com';
    input.birthDate = '11/07/2022';
    const response = await postGraphQL(mutation, input);
    expect(response.body.errors[0].extensions.exception.code).deep.eq(400);
    expect(response.body.errors[0].message).deep.eq('A data de nascimento está no futuro');
  });

  it('should fail to create user due to out of pattern date', async () => {
    input.email = 'test5@test.com';
    input.birthDate = '1991/09/17';
    const response = await postGraphQL(mutation, input);
    expect(response.body.errors[0].extensions.exception.code).deep.eq(400);
    expect(response.body.errors[0].message).deep.eq('A data de nascimento deve estar no formato dd/mm/yyyy');
  });
});

describe('Create user with addresses mutation test', () => {
  const mutation = `
    mutation CreateUser($data: CreateUserInput) {
      createUser(data: $data) {
        id
        name
        email
        password
        birthDate
        addresses{
          id
          CEP
          street
          streetNumber
          neighborhood
          city
          state
          complement
        }
      }
    }
  `;

  let input: CreateUserInput;

  beforeEach(async () => {
    token = await tokenCreate();
    input = {
      name: 'Teste 2',
      email: 'test2@test.com',
      password: 'test123',
      birthDate: '17/09/1991',
      addresses: [
        {
          CEP: '71909180',
          street: 'quadra 104',
          streetNumber: 1,
          complement: 'Lote 10',
          neighborhood: 'Águas Claras',
          city: 'Brasília',
          state: 'DF',
        },
        {
          CEP: '71909180',
          street: 'quadra 104',
          streetNumber: 2,
          complement: null,
          neighborhood: 'Águas Claras',
          city: 'Brasília',
          state: 'DF',
        },
      ],
    };
  });

  it('should create an user in the test database and return his details with the addresses', async () => {
    const response = await postGraphQL(mutation, input);
    expect(response.statusCode).deep.eq(200);
    expect(response.body.data.createUser.id).to.be.a('number');
    expect(response.body.data.createUser.name).deep.eq('Teste 2');
    expect(response.body.data.createUser.email).deep.eq('test2@test.com');
    expect(response.body.data.createUser.birthDate).deep.eq('17/09/1991');
    expect(response.body.data.createUser.addresses).deep.eq([
      {
        id: 1,
        CEP: '71909180',
        street: 'quadra 104',
        streetNumber: 1,
        complement: 'Lote 10',
        neighborhood: 'Águas Claras',
        city: 'Brasília',
        state: 'DF',
      },
      {
        id: 2,
        CEP: '71909180',
        street: 'quadra 104',
        streetNumber: 2,
        complement: null,
        neighborhood: 'Águas Claras',
        city: 'Brasília',
        state: 'DF',
      },
    ]);

    const createdUser = await getRepository(User).findOne(
      {
        id: response.body.data.createUser.id,
      },
      { relations: ['addresses'] },
    );
    expect(createdUser.id).to.be.a('number');
    expect(createdUser.id).deep.eq(response.body.data.createUser.id);
    expect(createdUser.name).deep.eq('Teste 2');
    expect(createdUser.email).deep.eq('test2@test.com');
    expect(createdUser.birthDate).deep.eq('17/09/1991');
    expect(createdUser.password).to.be.a('String');
    expect(createdUser.addresses).deep.eq([
      {
        id: 1,
        CEP: '71909180',
        street: 'quadra 104',
        streetNumber: 1,
        complement: 'Lote 10',
        neighborhood: 'Águas Claras',
        city: 'Brasília',
        state: 'DF',
      },
      {
        id: 2,
        CEP: '71909180',
        street: 'quadra 104',
        streetNumber: 2,
        complement: null,
        neighborhood: 'Águas Claras',
        city: 'Brasília',
        state: 'DF',
      },
    ]);
  });
});

describe('User details query test', () => {
  const query = `
    query User($data: UserInput!) {
      user(data: $data){
        id
        name
        email
        birthDate
        addresses {
          id
          CEP
          street
          streetNumber
          neighborhood
          city
          state
          complement
        }
      }
    }
  `;

  let input: UserInput;

  beforeEach(async () => {
    token = await tokenCreate();
    input = {
      id: 51,
    };
  });

  it('should fail to get user due to token not found', async () => {
    token = '';
    const response = await postGraphQL(query, input);
    expect(response.body.errors[0].extensions.exception.code).deep.eq(401);
    expect(response.body.errors[0].message).deep.eq('Token not found');
  });

  it('should fail to get user due to invalid token', async () => {
    token = await jwt.sign({ id: 51 }, 'invalidToken', {
      expiresIn: '4h',
    });
    const response = await postGraphQL(query, input);
    expect(response.body.errors[0].extensions.exception.code).deep.eq(401);
    expect(response.body.errors[0].message).deep.eq('Invalid token');
  });

  it('should get user details', async () => {
    const response = await postGraphQL(query, input);
    expect(response.statusCode).deep.eq(200);
    expect(response.body.data.user.id).to.be.a('number');
    expect(response.body.data.user.name).deep.eq('Teste');
    expect(response.body.data.user.email).deep.eq('test1@test.com');
    expect(response.body.data.user.birthDate).deep.eq('17/09/1991');
  });

  it('should fail to get user due to user not found', async () => {
    input.id = -1;
    const response = await postGraphQL(query, input);
    expect(response.body.errors[0].message).deep.eq('Usuário não cadastrado');
  });
});

describe('Login user mutation test', () => {
  const mutation = `
    mutation Login($data: LoginInput!) {
      login(data: $data) {
        user{
          id
          name
          email
          password
          birthDate
          addresses {
            id
            CEP
            street
            streetNumber
            neighborhood
            city
            state
            complement
          }
        }
        token
      }
    }
  `;

  let input: LoginInput;

  beforeEach(() => {
    input = {
      email: 'test1@test.com',
      password: 'test123',
      rememberMe: false,
    };
  });

  it('should login and return the user token and details with the rememberMe false', async () => {
    const response = await postGraphQL(mutation, input);
    expect(response.statusCode).deep.eq(200);
    expect(response.body.data.login.token).to.be.a('string');
    expect(response.body.data.login.user.id).to.be.a('number');
    expect(response.body.data.login.user.name).deep.eq('Teste');
    expect(response.body.data.login.user.email).deep.eq('test1@test.com');
    expect(response.body.data.login.user.birthDate).deep.eq('17/09/1991');
    const tokenVerify = await jwt.verify(response.body.data.login.token, process.env.JWT_SECRET);
    expect(tokenVerify.iat + 4 * 60 * 60).deep.eq(tokenVerify.exp);
  });

  it('should login and return the user token and details with the rememberMe true', async () => {
    input.rememberMe = true;
    const response = await postGraphQL(mutation, input);
    expect(response.statusCode).deep.eq(200);
    expect(response.body.data.login.token).to.be.a('string');
    expect(response.body.data.login.user.id).to.be.a('number');
    expect(response.body.data.login.user.name).deep.eq('Teste');
    expect(response.body.data.login.user.email).deep.eq('test1@test.com');
    expect(response.body.data.login.user.birthDate).deep.eq('17/09/1991');
    const tokenVerify = await jwt.verify(response.body.data.login.token, process.env.JWT_SECRET);
    expect(tokenVerify.iat + 7 * 24 * 60 * 60).deep.eq(tokenVerify.exp);
  });
});

describe('Users list query test', () => {
  const query = `
    query Users($data: UsersInput) {
      users(data: $data) {
        users {
          name
          email
          id
          password
          birthDate
          addresses {
            id
            CEP
            street
            streetNumber
            neighborhood
            city
            state
            complement
          }
        }
        count
        pageInfo{
          offset
          limit
          hasNextPage
          hasPreviousPage
        }
      }
    }
  `;

  let input: UsersInput;

  beforeEach(async () => {
    token = await tokenCreate();
    input = {
      offset: 0,
      limit: 10,
    };
  });

  it('should fail to get users list due to token not found', async () => {
    token = '';
    const response = await postGraphQL(query, input);
    expect(response.body.errors[0].extensions.exception.code).deep.eq(401);
    expect(response.body.errors[0].message).deep.eq('Token not found');
  });

  it('should fail to get users list due to invalid token', async () => {
    token = await jwt.sign({ id: 1 }, 'invalidToken', {
      expiresIn: '4h',
    });
    const response = await postGraphQL(query, input);
    expect(response.body.errors[0].extensions.exception.code).deep.eq(401);
    expect(response.body.errors[0].message).deep.eq('Invalid token');
  });

  it('should get users list with pagination info', async () => {
    const response = await postGraphQL(query, {});
    expect(response.statusCode).deep.eq(200);
    expect(response.body.data.users.count).deep.eq(52);
    expect(response.body.data.users.users.length).deep.eq(10);
    expect(response.body.data.users.pageInfo.hasNextPage).deep.eq(true);
    expect(response.body.data.users.pageInfo.hasPreviousPage).deep.eq(false);
    expect(response.body.data.users.pageInfo.offset).deep.eq(0);
    expect(response.body.data.users.pageInfo.limit).deep.eq(10);
  });

  it('should get users list with pagination info passing offset and limit params', async () => {
    const response = await postGraphQL(query, input);
    expect(response.statusCode).deep.eq(200);
    expect(response.body.data.users.count).deep.eq(52);
    expect(response.body.data.users.users.length).deep.eq(10);
    expect(response.body.data.users.pageInfo.hasNextPage).deep.eq(true);
    expect(response.body.data.users.pageInfo.hasPreviousPage).deep.eq(false);
    expect(response.body.data.users.pageInfo.offset).deep.eq(0);
    expect(response.body.data.users.pageInfo.limit).deep.eq(10);
  });

  it('should get users list with pagination info passing offset and limit params in the middle page', async () => {
    input.limit = 10;
    input.offset = 20;
    const response = await postGraphQL(query, input);
    expect(response.statusCode).deep.eq(200);
    expect(response.body.data.users.count).deep.eq(52);
    expect(response.body.data.users.users.length).deep.eq(10);
    expect(response.body.data.users.pageInfo.hasNextPage).deep.eq(true);
    expect(response.body.data.users.pageInfo.hasPreviousPage).deep.eq(true);
    expect(response.body.data.users.pageInfo.offset).deep.eq(20);
    expect(response.body.data.users.pageInfo.limit).deep.eq(10);
  });

  it('should get users list with pagination info passing offset and limit params in the last page', async () => {
    input.limit = 10;
    input.offset = 50;
    const response = await postGraphQL(query, input);
    expect(response.statusCode).deep.eq(200);
    expect(response.body.data.users.count).deep.eq(52);
    expect(response.body.data.users.users.length).deep.eq(2);
    expect(response.body.data.users.pageInfo.hasNextPage).deep.eq(false);
    expect(response.body.data.users.pageInfo.hasPreviousPage).deep.eq(true);
    expect(response.body.data.users.pageInfo.offset).deep.eq(50);
    expect(response.body.data.users.pageInfo.limit).deep.eq(10);
  });
});

after(async () => {
  await getRepository(Address).query('DROP TABLE "address"');
  await getRepository(User).query('DROP TABLE "user"');
  closeServer();
});

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  birthDate: string;
  addresses?: AddressInput[];
}

export interface AddressInput {
  CEP: string;
  street: string;
  streetNumber: number;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface UsersInput {
  offset: number;
  limit: number;
}

export interface UserInput {
  id: number;
}
