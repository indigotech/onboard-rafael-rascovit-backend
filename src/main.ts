import { ApolloServer } from 'apollo-server';
import resolvers from './resolvers';
import typeDefs from './type-defs';
import 'reflect-metadata';
import { createConnection, getConnection } from 'typeorm';
import { User } from './entity/user';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

const server = new ApolloServer({ resolvers, typeDefs });

export async function runServer() {
  const config: PostgresConnectionOptions = {
    type: 'postgres',
    url: process.env.TYPEORM_URL,
    entities: [User],
    synchronize: true,
    logging: false,
  };

  await createConnection(config);
  const { url } = await server.listen();
  console.log(`Running server at ${url}.`);
}

export async function closeServer() {
  getConnection().close();
  server.stop();
  console.log(`Server stoped.`);
}

