import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Prefer DATABASE_URL when set (e.g. Render links Postgres and injects it).
 * Avoids mismatched DB_* pieces and handles URL-encoded passwords in the URL.
 */
export function buildTypeOrmOptions(): TypeOrmModuleOptions {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const common = {
    autoLoadEntities: true,
    synchronize: process.env.TYPEORM_SYNC === 'true',
    logging: process.env.NODE_ENV === 'development',
  } as const;

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      ...common,
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'flowbrand_marketing',
    ...common,
  };
}
