import { getRepository } from 'typeorm';
import { User } from './entity/user';
import * as bcrypt from 'bcrypt';
import { CustomError } from './error';
import * as jwt from 'jsonwebtoken';
import { birthDateValidate, emailValidation, passwordValidation, verifyToken } from './validations';
import { Address } from './entity/address';

const saltRounds = 10;

export default {
  Query: {
    hello: async (_source, args, context) => {
      await verifyToken(context.authToken);
      return 'Hello, world!';
    },
    user: async (_source, args, context) => {
      await verifyToken(context.authToken);
      const user = await getRepository(User).findOne({ id: args.data.id }, { relations: ['addresses'] });
      if (!user) {
        throw new CustomError('Usuário não cadastrado', 404);
      }
      return user;
    },
    users: async (_source, args, context) => {
      await verifyToken(context.authToken);
      const offset = args?.data?.offset ?? 0;
      const limit = args?.data?.limit ?? 10;
      const [list, count] = await getRepository(User).findAndCount({
        order: { name: 'ASC' },
        skip: offset,
        take: limit,
        relations: ['addresses'],
      });
      const hasPreviousPage = offset > 0;
      const hasNextPage = offset + limit < count;
      return {
        users: list,
        count: count,
        pageInfo: {
          offset: offset,
          limit: limit,
          hasNextPage: hasNextPage,
          hasPreviousPage: hasPreviousPage,
        },
      };
    },
  },
  Mutation: {
    createUser: async (_source, args, context) => {
      await verifyToken(context.authToken);
      passwordValidation(args.data.password);
      await emailValidation(args.data.email);
      birthDateValidate(args.data.birthDate);
      const user = new User();
      user.name = args.data.name;
      user.email = args.data.email;
      user.password = await bcrypt.hash(args.data.password, saltRounds);
      user.birthDate = args.data.birthDate;
      user.addresses = args.data.addresses;

      if (user.addresses) {
        await getRepository(Address).save(user.addresses);
      }
      return await getRepository(User).manager.save(user);
    },
    login: async (_source, args) => {
      const user = await getRepository(User).findOne({ email: args.data.email });
      if (!user) {
        throw new CustomError('Usuário não cadastrado', 404);
      }
      const match = await bcrypt.compare(args.data.password, user.password);
      if (!match) {
        throw new CustomError('Senha incorreta', 401);
      }
      const tokenDuration = args.data.rememberMe ? '1 week' : '4h';
      const token = await jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: tokenDuration });

      return {
        user: user,
        token: token,
      };
    },
  },
};
