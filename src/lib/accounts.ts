import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { store } from './store';
export interface Account { email: string; hash: string; salt: string; businessId: string; role?: 'owner' | 'staff'; name?: string; active?: boolean; sessionVersion?: number }
export function accounts() { return (store.extra.accounts || []) as Account[]; }
export function passwordHash(password: string, salt: string) { return scryptSync(password, salt, 64).toString('hex'); }
export function registerAccount(email: string, password: string, businessId: string) {
  const salt = randomBytes(24).toString('hex');
  store.extra.accounts = [...accounts(), {email, salt, hash: passwordHash(password,salt), businessId}]; store.dirty = true;
}
export function verifyPassword(account: Account, password: string) {
  return timingSafeEqual(Buffer.from(account.hash,'hex'), Buffer.from(passwordHash(password, account.salt),'hex'));
}
export function throttle(key: string, limit: number, duration: number) {
  const now=Date.now();
  const records = (store.extra.rateLimits || {}) as Record<string,{count:number;until:number}>;
  for (const k of Object.keys(records)) if(records[k].until<now) delete records[k];
  const entry=records[key] || {count:0,until:now+duration}; entry.count++; records[key]=entry;
  store.extra.rateLimits=records;store.dirty=true;return entry.count<=limit;
}
