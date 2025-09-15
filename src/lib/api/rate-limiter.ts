import {Ratelimit} from '@upstash/ratelimit';
import {kv} from '@vercel/kv';

export const rateLimiter = new Ratelimit({
  redis: kv,
  // 10 requests from the same IP in 1 minute
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'vestigio_ratelimit',
});
