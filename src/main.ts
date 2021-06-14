import { ApolloServer } from 'apollo-server';
import resolvers from './resolvers';
import typeDefs from './type-defs';
import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { User } from './entity/user';

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

server.listen().then(({ url }) => console.log(`Running server at ${url}.`));
