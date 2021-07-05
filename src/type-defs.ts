import { gql } from 'apollo-server';

export default gql`
  type Query {
    hello: String
    users(data: UsersInput): UsersQuery
    user(data: UserInput): UserResponse
  }

  type Mutation {
    createUser(data: CreateUserInput): UserResponse
    login(data: LoginInput): LoginResponse
  }

  input UsersInput {
    offset: Int
    limit: Int
  }

  input UserInput {
    id: Int!
  }

  input AddressInput {
    CEP: String!
    street: String!
    streetNumber: Int!
    complement: String
    neighborhood: String!
    city: String!
    state: String!
  }

  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    birthDate: String
    addresses: [AddressInput]
  }

  input LoginInput {
    email: String!
    password: String!
    rememberMe: Boolean
  }

  type AddressType {
    id: Int
    CEP: String
    street: String
    streetNumber: Int
    neighborhood: String
    city: String
    state: String
    complement: String
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
    addresses: [AddressType]
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
