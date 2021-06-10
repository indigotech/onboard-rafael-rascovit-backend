import { ApolloServer, gql } from 'apollo-server';

const typeDefs = gql`
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Teste',
  },
};

const server = new ApolloServer({ resolvers, typeDefs });

server.listen().then(({ url }) => console.log(`Running server at ${url}. `));
