import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDatabaseConnection } from '../../database/connection';

export const DRIZZLE = 'DRIZZLE';
export const PG_POOL = 'PG_POOL';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        const { db } = createDatabaseConnection(dbUrl);
        return db;
      },
      inject: [ConfigService],
    },
    {
      provide: PG_POOL,
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        const { pool } = createDatabaseConnection(dbUrl);
        return pool;
      },
      inject: [ConfigService],
    },
  ],
  exports: [DRIZZLE, PG_POOL],
})
export class DatabaseModule {}
