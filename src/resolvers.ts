import { getRepository } from 'typeorm';
import { User } from './entity/user';
import * as bcrypt from 'bcrypt';

const saltRounds = 10;

function isFutureDate(birthDate) {
  let now = new Date();
  let month = (now.getMonth() + 1).toString();
  let newMonth = month.length == 1 ? '0' + month : month;
  let day = now.getDate().toString();
  let newDay = day.length == 1 ? '0' + day : day;
  let year = now.getFullYear().toString();

  let date = year + '/' + newMonth + '/' + newDay;
  let newBirth = birthDate.split('/')[2] + '/' + birthDate.split('/')[1] + '/' + birthDate.split('/')[0];

  if(Date.parse(newBirth) > Date.parse(date)){
    return true;
  } else {
    return false;
  }
}

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
      var dtRegex =
        /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;
      const emailRegex =
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      const passRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{7,}$/;
      const email = await getRepository(User).findOne({
        email: args.email,
      });
      if (!passRegex.test(args.password)) {
        throw 'Senha precisa conter 7 dígitos com pelo menos uma letra e um número';
      } else if (email) {
        throw 'E-mail ja cadastrado';
      } else if (!emailRegex.test(args.email)) {
        throw 'E-mail inválido';
      } else if (!dtRegex.test(args.birthDate)) {
        throw 'A data de nascimento deve estar no formato dd/mm/yyyy';
      } else if (isFutureDate(args.birthDate)) {
        throw 'A data de nascimento está no futuro';
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
