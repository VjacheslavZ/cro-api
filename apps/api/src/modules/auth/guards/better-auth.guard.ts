import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';

import { PrismaService } from '../../../prisma/prisma.service';
import { getAuth } from '../../../auth';

@Injectable()
export class BetterAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const session = await getAuth().api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) throw new UnauthorizedException();

    const user = await this.prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true, isBlocked: true },
    });

    if (!user || user.isBlocked) throw new UnauthorizedException();

    request.user = { id: user.id, email: user.email, role: user.role };
    return true;
  }
}
