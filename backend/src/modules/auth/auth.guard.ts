import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { ForbiddenError } from '../../common/errors/domain-error';
import { AuthService, type AuthSession, type AuthUser } from './auth.service';

export type AuthenticatedRequest = Request & {
  user?: AuthUser;
  session?: AuthSession;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers.append(key, value);
      } else if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      }
    }

    const sessionResponse =
      await this.authService.getSessionFromHeaders(headers);
    if (!sessionResponse || !sessionResponse.user) {
      throw new ForbiddenError('Unauthorized');
    }

    req.user = sessionResponse.user;
    req.session = sessionResponse.session;
    return true;
  }
}
