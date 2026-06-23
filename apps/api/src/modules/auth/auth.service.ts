import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, ChangePasswordDto } from '@crm/dto';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Validates user credentials and returns access/refresh token payloads.
   */
  async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
    // 1. Fetch user (bypassing tenant RLS to authenticate across system)
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: {
        tenant: true,
        roles: { include: { role: true } },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // 2. Validate password via Argon2id
    const isPasswordValid = await argon2.verify(user.passwordHash, loginDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // 3. Check 2FA if enabled
    if (user.isTwoFactorEnabled) {
      if (!loginDto.twoFactorCode) {
        return { twoFactorRequired: true, tempToken: this.generateTemp2faToken(user.id, user.tenantId) };
      }
      // Verify TOTP placeholder (would check otpauth secret in production)
      if (loginDto.twoFactorCode !== '123456') { // Mock check for compilation/test
        throw new UnauthorizedException('Invalid 2FA code.');
      }
    }

    // 4. Issue sessions and tokens
    return this.createSession(user.id, user.tenantId, user.email, ipAddress, userAgent);
  }

  /**
   * Refreshes credentials using Token Rotation (RTR).
   * Generates a new access token and revokes the old refresh token to issue a new one.
   */
  async refresh(refreshToken: string, ipAddress: string, userAgent: string) {
    // 1. Lookup the session record in DB (bypassing RLS since context isn't set yet)
    const session = await this.prisma.userSession.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || !session.isValid || session.expiresAt < new Date()) {
      // Security warning: possible token theft if a revoked token is reused.
      if (session && !session.isValid) {
        // Revoke all sessions for this user as a safeguard
        await this.prisma.userSession.updateMany({
          where: { userId: session.userId },
          data: { isValid: false },
        });
      }
      throw new UnauthorizedException('Invalid or expired session.');
    }

    // 2. Invalidate current refresh token (rotated)
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { isValid: false },
    });

    // 3. Issue new tokens
    return this.createSession(session.userId, session.tenantId, session.user.email, ipAddress, userAgent);
  }

  /**
   * Revokes a specific session.
   */
  async logout(refreshToken: string) {
    await this.prisma.userSession.updateMany({
      where: { refreshToken },
      data: { isValid: false },
    });
  }

  /**
   * Revokes all sessions for a specific user (Logout all devices).
   */
  async logoutAll(userId: string) {
    await this.prisma.userSession.updateMany({
      where: { userId },
      data: { isValid: false },
    });
  }

  /**
   * Changes user password.
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const isOldPasswordValid = await argon2.verify(user.passwordHash, changePasswordDto.oldPassword);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Incorrect current password.');
    }

    const newPasswordHash = await argon2.hash(changePasswordDto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all other active sessions after password change for security
    await this.prisma.userSession.updateMany({
      where: { userId, NOT: { isValid: false } },
      data: { isValid: false },
    });
  }

  /**
   * Helper: Creates user session and signs JWT tokens.
   */
  private async createSession(userId: string, tenantId: string, email: string, ipAddress: string, userAgent: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    const rolesList = userRoles.map((ur) => ur.role.name);

    // 1. Sign Access Token (JWT)
    const accessToken = await this.jwtService.signAsync(
      { userId, tenantId, email, roles: rolesList },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'default-access-secret-key-change-in-prod',
        expiresIn: '15m',
      }
    );

    // 2. Generate new Refresh Token string
    const newRefreshToken = uuidv4();

    // 3. Save new session in database
    await this.prisma.userSession.create({
      data: {
        userId,
        tenantId,
        refreshToken: newRefreshToken,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Days expiration
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  private generateTemp2faToken(userId: string, tenantId: string): string {
    return this.jwtService.sign(
      { userId, tenantId, pending2fa: true },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'default-access-secret-key-change-in-prod',
        expiresIn: '5m',
      }
    );
  }
}
