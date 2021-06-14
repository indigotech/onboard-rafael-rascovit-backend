import { gql } from 'apollo-server';

export default gql`
  type Query {
    hello: String
    users: UsersQuery
    user(id: Int): UserResponse
  }

  type Mutation {
    createUser(
      name: String
      email: String
      password: String
      birthDate: String
    ): UserResponse
  }

  type UserResponse {
    id: Int
    name: String
    email: String
    password: String
    birthDate: String
  }

  type UsersQuery {
    users: [UserResponse]
  }
`;
