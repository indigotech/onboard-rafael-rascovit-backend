import { getRepository } from 'typeorm';
import { User } from './entity/user';
import { CustomError } from './error';
import * as jwt from 'jsonwebtoken';

const dtRegex =
  /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;
const emailRegex =
  /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const passRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{7,}$/;

export function passwordValidation(param) {
  if (!passRegex.test(param)) {
    throw new CustomError('Senha precisa conter 7 dígitos com pelo menos uma letra e um número', 400);
  }
}

export async function emailValidation(param) {
  const email = await getRepository(User).findOne({
    email: param,
  });
  if (email) {
    throw new CustomError('E-mail ja cadastrado', 409);
  } else if (!emailRegex.test(param)) {
    throw new CustomError('E-mail inválido', 400);
  }
}

export function birthDateValidate(param) {
  if (!dtRegex.test(param)) {
    throw new CustomError('A data de nascimento deve estar no formato dd/mm/yyyy', 400);
  } else if (isFutureDate(param)) {
    throw new CustomError('A data de nascimento está no futuro', 400);
  }
}

function isFutureDate(birthDate) {
  const now = new Date();
  const month = (now.getMonth() + 1).toString();
  const newMonth = month.length == 1 ? '0' + month : month;
  const day = now.getDate().toString();
  const newDay = day.length == 1 ? '0' + day : day;
  const year = now.getFullYear().toString();

  const date = year + '/' + newMonth + '/' + newDay;
  const newBirth = birthDate.split('/')[2] + '/' + birthDate.split('/')[1] + '/' + birthDate.split('/')[0];

  return Date.parse(newBirth) > Date.parse(date);
}

export async function verifyToken(token) {
  if (!token) {
    throw new CustomError('Token not found', 401);
  }
  try {
    await jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new CustomError('Invalid token', 401);
  }
}
