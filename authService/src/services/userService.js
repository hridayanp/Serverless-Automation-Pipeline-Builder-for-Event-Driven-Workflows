import { saveUser as saveUserToDB } from '../utils/db.js';
import { v4 as uuidv4 } from 'uuid';

export const saveUser = async (email) => {
  const user = { userId: uuidv4(), email };
  await saveUserToDB(user);
  return user;
};
