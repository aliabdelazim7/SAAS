import { IsNotEmpty, IsOptional, IsString, IsNumber, IsUUID } from 'class-validator';

export class CreateWarehouseDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateWarehouseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class AdjustStockDto {
  @IsNotEmpty()
  @IsUUID()
  variantId: string;

  @IsNotEmpty()
  @IsUUID()
  warehouseId: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number; // Positive to add, negative to subtract
}
