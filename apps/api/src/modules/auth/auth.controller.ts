import { Controller, Post, Body, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import * as fastify from 'fastify';
import { AuthService } from './auth.service';
import { LoginDto, ChangePasswordDto, RegisterDto } from '@crm/dto';
import { AuthGuard } from './guards/auth.guard';
import { TenantService } from '../tenant/tenant.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tenantService: TenantService
  ) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: any,
    @Res({ passthrough: true }) reply: fastify.FastifyReply
  ) {
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // 1. Transactional tenant bootstrapping (Tenant, Owner User, Roles, Subscription)
    await this.tenantService.bootstrapTenant(registerDto);

    // 2. Perform automatic login after registration
    const tokens = (await this.authService.login({
      email: registerDto.email,
      password: registerDto.password,
    }, ipAddress, userAgent)) as { accessToken: string; refreshToken: string };

    if (tokens.refreshToken) {
      this.setCookie(reply, tokens.refreshToken);
    }

    return { success: true, accessToken: tokens.accessToken };
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: any,
    @Res({ passthrough: true }) reply: fastify.FastifyReply
  ) {
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await this.authService.login(loginDto, ipAddress, userAgent);

    if ('refreshToken' in result && result.refreshToken) {
      this.setCookie(reply, result.refreshToken);
      return { success: true, accessToken: result.accessToken };
    }

    return result; // Returns 2FA token if pending
  }

  @Post('refresh')
  async refresh(
    @Req() req: any,
    @Res({ passthrough: true }) reply: fastify.FastifyReply
  ) {
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Fastify Cookie Parser resolves cookies to req.cookies object
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
      throw new UnauthorizedException('No session token found.');
    }

    const tokens = await this.authService.refresh(refreshToken, ipAddress, userAgent);

    this.setCookie(reply, tokens.refreshToken);

    return { success: true, accessToken: tokens.accessToken };
  }

  @Post('logout')
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) reply: fastify.FastifyReply
  ) {
    const refreshToken = req.cookies['refreshToken'];
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    reply.clearCookie('refreshToken', {
      path: '/auth/refresh',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return { success: true };
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @Req() req: any,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    const userId = req.user.userId;
    await this.authService.changePassword(userId, changePasswordDto);
    return { success: true };
  }

  private setCookie(reply: fastify.FastifyReply, token: string) {
    reply.setCookie('refreshToken', token, {
      path: '/auth/refresh', // Restrict cookie transmitting to the refresh path
      httpOnly: true,
      secure: true, // Enforce Secure cookies in production/dev for Fastify stability
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days in milliseconds
    });
  }
}
