import * as dotenv from 'dotenv';
dotenv.config({ path: 'test.env' });
import * as request from 'supertest';
import { expect } from 'chai';
import { runServer, closeServer } from '../src/main';
import { getRepository } from 'typeorm';
import { User } from '../src/entity/user';

before(async () => {
  await runServer();
});

describe('Hello world test', () => {
  it('should return with Hello, world!', async () => {
    const response = await request('localhost:4000')
      .post('/')
      .send({
        query: `query {
            hello
        }`,
      });

    expect(response.statusCode).to.equal(200);
    expect(response.body.data.hello).to.be.eq('Hello, world!');
  });
});

describe('Create user test', () => {
  it('should create an user in the test database and return his details', async () => {
    const response = await request('localhost:4000')
      .post('/')
      .send({
        query: `mutation{
            createUser(
                name:"Teste",
                email:"test1@test.com",
                password:"test123",
                birthDate:"17/09/1991"
            ){
                id
                name
                email
                password
                birthDate
            }
        }`,
      });

    expect(response.statusCode).to.be.eq(200);
    expect(response.body.data.createUser.id).to.be.a('number');
    expect(response.body.data.createUser.name).to.be.eq('Teste');
    expect(response.body.data.createUser.email).to.be.eq('test1@test.com');
    expect(response.body.data.createUser.birthDate).to.be.eq('17/09/1991');
  });
});

describe('Create user test - Error case', () => {
  it('should fail to create user due to invalid email', async () => {
    const response = await request('localhost:4000')
      .post('/')
      .send({
        query: `mutation{
            createUser(
                name:"Teste",
                email:"test@",
                password:"test123",
                birthDate:"17/09/1991"
            ){
                id
                name
                email
                password
                birthDate
            }
        }`,
      });
    expect(response.body.errors[0].message).to.be.eq('Unexpected error value: "E-mail inválido"');
  });
});

describe('Create user test - Error case', () => {
  it('should fail to create user due to short password', async () => {
    const response = await request('localhost:4000')
      .post('/')
      .send({
        query: `mutation{
            createUser(
                name:"Teste",
                email:"test2@test.com",
                password:"test1",
                birthDate:"17/09/1991"
            ){
                id
                name
                email
                password
                birthDate
            }
        }`,
      });
    expect(response.body.errors[0].message).to.be.eq(
      'Unexpected error value: "Senha precisa conter 7 dígitos com pelo menos uma letra e um número"',
    );
  });
});

describe('Create user test - Error case', () => {
  it('should fail to create user due to without number password', async () => {
    const response = await request('localhost:4000')
      .post('/')
      .send({
        query: `mutation{
            createUser(
                name:"Teste",
                email:"test3@test.com",
                password:"testtest",
                birthDate:"17/09/1991"
            ){
                id
                name
                email
                password
                birthDate
            }
        }`,
      });
    expect(response.body.errors[0].message).to.be.eq(
      'Unexpected error value: "Senha precisa conter 7 dígitos com pelo menos uma letra e um número"',
    );
  });
});

describe('Create user test - Error case', () => {
  it('should fail to create user due to future date', async () => {
    const response = await request('localhost:4000')
      .post('/')
      .send({
        query: `mutation{
            createUser(
                name:"Teste",
                email:"test4@test.com",
                password:"test123",
                birthDate:"11/07/2022"
            ){
                id
                name
                email
                password
                birthDate
            }
        }`,
      });
    expect(response.body.errors[0].message).to.be.eq('Unexpected error value: "A data de nascimento está no futuro"');
  });
});

after(async () => {
  await getRepository(User).query('DROP TABLE "user"');
  await closeServer();
});
