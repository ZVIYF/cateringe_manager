import IORedis, { type RedisOptions } from 'ioredis';

const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';

export const defaultRedisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
};

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(redisUrl, defaultRedisOptions);
    connection.on('error', (err) => {
      // Log connection error in non-test mode
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[Redis] Connection error:', err.message);
      }
    });
  }
  return connection;
}

export function setRedisConnection(custom: IORedis): void {
  connection = custom;
}

