import { IsNotEmpty, IsOptional, IsString, IsNumber, IsUUID, IsArray, ValidateNested, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceItemDto {
  @IsNotEmpty()
  @IsUUID()
  variantId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number; // e.g. 15 for 15%

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;
}

export class CreateInvoiceDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsNotEmpty()
  @IsString()
  status: string; // 'DRAFT', 'UNPAID', 'PAID'

  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsUUID()
  warehouseId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}

export class POSCheckoutDto {
  @IsNotEmpty()
  @IsUUID()
  warehouseId: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];

  @IsNotEmpty()
  @IsString()
  paymentMethod: string; // 'CASH', 'CARD', 'SPLIT'

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amountPaid: number;
}
