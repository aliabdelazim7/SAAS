import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsUUID } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long.' })
  password: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsNotEmpty()
  @IsString()
  businessName: string;

  @IsNotEmpty()
  @IsString()
  subdomain: string;

  @IsNotEmpty()
  @IsString()
  industryType: string; // 'RETAIL', 'GARAGE', 'TAILOR', etc.

  @IsNotEmpty()
  @IsString()
  planName: string; // 'STARTER', 'BUSINESS', 'PROFESSIONAL'
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  twoFactorCode?: string;
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long.' })
  newPassword: string;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long.' })
  newPassword: string;
}

export class VerifyEmailDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}
