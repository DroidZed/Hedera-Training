import { config } from 'dotenv';

config();

export const ACC_ID = `${process.env.ACC_ID}`;
export const PRIV_KEY = `${process.env.PRIV_KEY}`;
