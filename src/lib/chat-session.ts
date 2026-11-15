import { createHmac, timingSafeEqual } from 'node:crypto';
export function chatToken(id:string){if(!process.env.ADMIN_SESSION_SECRET)throw Error('Session secret missing');return id+'.'+createHmac('sha256',process.env.ADMIN_SESSION_SECRET).update('chat:'+id).digest('hex');}
export function chatId(token?:string){if(!token)return undefined;const i=token.lastIndexOf('.');const id=token.slice(0,i);if(i<1)return undefined;const expected=chatToken(id);return expected.length===token.length&&timingSafeEqual(Buffer.from(expected),Buffer.from(token))?id:undefined;}
