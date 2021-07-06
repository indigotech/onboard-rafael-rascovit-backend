import { getRepository } from 'typeorm';
import { User } from '../entity/user';
import * as bcrypt from 'bcrypt';

const saltRounds = 10;

export async function seedAdmin() {
  const user = new User();
  user.name = 'Taqtile';
  user.email = 'admin@taqtile.com.br';
  user.password = await bcrypt.hash('1234qwer', saltRounds);
  user.birthDate = '17/09/1991';
  return getRepository(User).manager.save(user);
}

export async function seedDatabase() {
  for (let i = 1; i <= 50; i++) {
    const user = new User();
    user.name = i < 10 ? `Taqtile user 0${i}` :`Taqtile user ${i}`;
    user.email = `taqtile.user${i}@taqtile.com.br`;
    user.password = await bcrypt.hash('1234qwer', saltRounds);
    user.birthDate = '17/09/1991';

    await getRepository(User).save(user);
  }
}
