import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as authSchema from '../../database/auth-schema';
import * as appSchema from '../../database/schema';
import { DRIZZLE } from '../database/database.module';

export type AuthInstance = ReturnType<AuthService['createAuth']>;
export type AuthUser = AuthInstance['$Infer']['Session']['user'];
export type AuthSession = AuthInstance['$Infer']['Session']['session'];

@Injectable()
export class AuthService implements OnModuleInit {
  public auth!: AuthInstance;

  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof authSchema & typeof appSchema>,
    private readonly configService: ConfigService,
  ) {}

  private createAuth() {
    return betterAuth({
      database: drizzleAdapter(this.db, {
        provider: 'pg',
      }),
      secret: this.configService.get<string>('BETTER_AUTH_SECRET'),
      baseURL:
        this.configService.get<string>('BETTER_AUTH_URL') ||
        'http://localhost:3000',
      trustedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      socialProviders: {
        google: {
          clientId: this.configService.get<string>('GOOGLE_CLIENT_ID') || '',
          clientSecret:
            this.configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
        },
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
      },
    } satisfies BetterAuthOptions);
  }

  onModuleInit() {
    this.auth = this.createAuth();
  }

  async getSessionFromHeaders(headers: Headers) {
    return this.auth.api.getSession({ headers });
  }
}
