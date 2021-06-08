import { ApolloServer, gql } from 'apollo-server';

const typeDefs = gql`
    type Query {
        hello: String
    }
`;

const resolvers = {
    Query: {
        hello: () => 'Hello, world!'
    },
}

const server = new ApolloServer({ resolvers, typeDefs });

server.listen()
  .then(({ url }) => console.log(`Running server at ${url}. `));