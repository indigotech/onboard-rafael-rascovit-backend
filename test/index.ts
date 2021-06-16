import * as dotenv from 'dotenv';
dotenv.config({ path: 'test.env' });
import * as request from 'supertest';
import { expect } from 'chai';
import { runServer, closeServer } from '../src/main';
import { getRepository } from 'typeorm';
import { User } from '../src/entity/user';

function postGraphQL(queryOrMutation: string, input) {
  return request('localhost:4000').post('/').send({ query: queryOrMutation, variables: input });
}

before(async () => {
  await runServer();
});

describe('Hello world query test', () => {
  it('should return with Hello, world!', async () => {
    const query = `
      query {
        hello
      }
    `;
    const response = await postGraphQL(query, {});

    expect(response.statusCode).to.equal(200);
    expect(response.body.data.hello).to.be.eq('Hello, world!');
  });
});

describe('Create user mutation test', () => {
  const mutation = `
    mutation CreateUser($name: String!, $email: String!, $password: String!, $birthDate: String!) {
      createUser(name: $name, email: $email, password: $password, birthDate: $birthDate) {
        id
        name
        email
        password
        birthDate
      }
    }
  `;

  let input: UserInput;

  beforeEach(() => {
    input = {
      name: 'Teste',
      email: 'test1@test.com',
      password: 'test123',
      birthDate: '17/09/1991',
    };
  });

  it('should create an user in the test database and return his details', async () => {
    const response = await postGraphQL(mutation, input);
    expect(response.statusCode).to.equal(200);
    expect(response.body.data.createUser.id).to.be.a('number');
    expect(response.body.data.createUser.name).to.equal('Teste');
    expect(response.body.data.createUser.email).to.equal('test1@test.com');
    expect(response.body.data.createUser.birthDate).to.equal('17/09/1991');

    const createdUser = await getRepository(User).findOne({
      id: response.body.data.createUser.id,
    });
    expect(createdUser.id).to.be.a('number');
    expect(createdUser.id).to.equal(response.body.data.createUser.id);
    expect(createdUser.name).to.equal('Teste');
    expect(createdUser.email).to.equal('test1@test.com');
    expect(createdUser.birthDate).to.equal('17/09/1991');
    expect(createdUser.password).to.be.a('String');
  });

  it('should fail to create user due to invalid e-mail', async () => {
    input.email = 'test@';
    const response = await postGraphQL(mutation, input);
    expect(response.body.errors[0].extensions.exception.code).to.equal(400);
    expect(response.body.errors[0].message).to.equal('E-mail inválido');
  });

  it('should fail to create user due to email already registered', async () => {
    const response = await postGraphQL(mutation, input);
    expect(response.body.errors[0].extensions.exception.code).to.equal(409);
    expect(response.body.errors[0].message).to.equal('E-mail ja cadastrado');
  });

  it('should fail to create user due to short password', async () => {
    input.email = 'test2@test.com';
    input.password = 'test1';
    const response = await postGraphQL(mutation, input);
    expect(response.body.errors[0].extensions.exception.code).to.equal(400);
    expect(response.body.errors[0].message).to.equal(
      'Senha precisa conter 7 dígitos com pelo menos uma letra e um número',
    );
  });

  it('should fail to create user due to without number password', async () => {
    input.email = 'test3@test.com';
    input.password = 'testtest';
    const response = await postGraphQL(mutation, input);
    expect(response.body.errors[0].extensions.exception.code).to.equal(400);
    expect(response.body.errors[0].message).to.equal(
      'Senha precisa conter 7 dígitos com pelo menos uma letra e um número',
    );
  });

  it('should fail to create user due to future date', async () => {
    input.email = 'test4@test.com';
    input.birthDate = '11/07/2022';
    const response = await postGraphQL(mutation, input);
    expect(response.body.errors[0].extensions.exception.code).to.equal(400);
    expect(response.body.errors[0].message).to.equal('A data de nascimento está no futuro');
  });

  it('should fail to create user due to out of pattern date', async () => {
    input.email = 'test5@test.com';
    input.birthDate = '1991/09/17';
    const response = await postGraphQL(mutation, input);
    expect(response.body.errors[0].extensions.exception.code).to.equal(400);
    expect(response.body.errors[0].message).to.equal('A data de nascimento deve estar no formato dd/mm/yyyy');
  });
});

after(async () => {
  await getRepository(User).query('DROP TABLE "user"');
  closeServer();
});

export interface UserInput {
  name: string;
  email: string;
  password: string;
  birthDate: string;
}
