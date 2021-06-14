import { getRepository } from 'typeorm';
import { User } from './entity/user';
import * as bcrypt from 'bcrypt';

const saltRounds = 10;

export default {
  Query: {
    hello: () => 'Hello, world!',
    user: async (_source, args) => {
      const user = await getRepository(User).findOne({ id: args.id });
      if (!user) {
        console.log('Usuário não encontrado.');
      }
      return user;
    },
    users: async (_source) => {
      const response = await getRepository(User).find({
        select: ['id', 'name', 'email', 'password', 'birthDate'],
      });
      return {
        users: response,
      };
    },
  },
  Mutation: {
    createUser: async (_source, args) => {
      const email = await getRepository(User).findOne({
        email: args.email,
      });
      if (args.password.length < 7) {
        return;
      } else if (email) {
        return;
      }
      const user = new User();
      user.name = args.name;
      user.email = args.email;
      user.password = await bcrypt.hash(args.password, saltRounds);
      user.birthDate = args.birthDate;
      return getRepository(User).manager.save(user);
    },
  },
};
