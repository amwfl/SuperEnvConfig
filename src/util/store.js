import {send, request} from './pipe';

export const storeSet = (key, value) => send('storeSet', {key, value});
export const storeGet = (key) => request('storeGet', {key});
