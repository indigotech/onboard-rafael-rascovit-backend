import { ApolloServer } from 'apollo-server';
import * as assert from 'assert';
import * as request from 'supertest';
import { createConnection } from 'typeorm';
import { User } from '../src/entity/user';
import resolvers from '../src/resolvers';
import typeDefs from '../src/type-defs';

before(async () => {
  createConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'rascotile',
    password: '123123',
    database: 'databoard_db',
    entities: [User],
    synchronize: true,
    logging: false,
  })
    .then(() => {})
    .catch((error) => console.log(error));

  const server = new ApolloServer({ resolvers, typeDefs });

  await server.listen().then(({ url }) => console.log(`Running server at ${url}.`));
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
      console.log(response.body.data);
  });
});
