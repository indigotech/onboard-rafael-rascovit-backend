import { getRepository } from 'typeorm';
import { User } from './entity/user';
import * as bcrypt from 'bcrypt';
import { CustomError } from './error';
import * as jwt from 'jsonwebtoken';
import { birthDateValidate, emailValidation, passwordValidation, verifyToken } from './validations';

const saltRounds = 10;

export default {
  Query: {
    hello: async (_source, args, context) => {
      await verifyToken(context.authToken);
      return 'Hello, world!';
    },
    user: async (_source, args, context) => {
      await verifyToken(context.authToken);
      const user = await getRepository(User).findOne({ id: args.id });
      if (!user) {
        throw new CustomError('Usuário não cadastrado', 404);
      }
      return user;
    },
    users: async (_source, args, context) => {
      await verifyToken(context.authToken);
      const response = await getRepository(User).find();
      return {
        users: response,
      };
    },
  },
  Mutation: {
    createUser: async (_source, args, context) => {
      await verifyToken(context.authToken);
      passwordValidation(args.password);
      await emailValidation(args.email);
      birthDateValidate(args.birthDate);
      const user = new User();
      user.name = args.name;
      user.email = args.email;
      user.password = await bcrypt.hash(args.password, saltRounds);
      user.birthDate = args.birthDate;
      return getRepository(User).manager.save(user);
    },
    login: async (_source, args) => {
      const user = await getRepository(User).findOne({ email: args.email });
      if (!user) {
        throw new CustomError('Usuário não cadastrado', 404);
      }
      const match = await bcrypt.compare(args.password, user.password);
      if (!match) {
        throw new CustomError('Senha incorreta', 401);
      }
      const tokenDuration = args.rememberMe ? '1 week' : '4h';
      const token = await jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: tokenDuration });

      return {
        user: user,
        token: token,
      };
    },
  },
};
