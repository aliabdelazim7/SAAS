import { IsNotEmpty, IsOptional, IsString, IsNumber, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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

export class TransferItemDto {
  @IsNotEmpty()
  @IsUUID()
  variantId: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}

export class TransferStockDto {
  @IsNotEmpty()
  @IsUUID()
  sourceWarehouseId: string;

  @IsNotEmpty()
  @IsUUID()
  destWarehouseId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items: TransferItemDto[];
}

export class AuditItemDto {
  @IsNotEmpty()
  @IsUUID()
  variantId: string;

  @IsNotEmpty()
  @IsNumber()
  auditedQuantity: number;
}

export class InventoryAuditDto {
  @IsNotEmpty()
  @IsUUID()
  warehouseId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuditItemDto)
  items: AuditItemDto[];
}
