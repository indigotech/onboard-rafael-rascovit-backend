import { gql } from 'apollo-server';

export default gql`
  type Query {
    hello: String
    users(offset: Int = 0, limit: Int = 10): UsersQuery
    user(id: Int): UserResponse
  }

  type Mutation {
    createUser(name: String, email: String, password: String, birthDate: String): UserResponse
    login(email: String, password: String, rememberMe: Boolean): LoginResponse
  }

  type LoginResponse {
    user: UserResponse
    token: String
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
    count: Int
    pageInfo: PageInfoType
  }

  type PageInfoType {
    offset: Int
    limit: Int
    hasNextPage: Boolean
    hasPreviousPage: Boolean
  }
`;
