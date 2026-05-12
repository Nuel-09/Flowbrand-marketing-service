import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Prefer DATABASE_URL when set (e.g. Render links Postgres and injects it).
 * Also accepts DB_URL — some dashboards use that name by mistake.
 * Strips embedded newlines so a pasted multi-line URL still parses.
 */
function resolveDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL ?? process.env.DB_URL;
  const singleLine = raw?.replace(/\r?\n/g, '').trim();
  return singleLine || undefined;
}

export function buildTypeOrmOptions(): TypeOrmModuleOptions {
  const databaseUrl = resolveDatabaseUrl();
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
    database:
      process.env.DB_NAME ??
      process.env.DB_DATABASE ??
      'flowbrand_marketing',
    ...common,
  };
}
