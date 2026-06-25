import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class JournalEntryLineDto {
  @IsNotEmpty()
  @IsString()
  accountCode: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  debit: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  credit: number;
}

export class CreateJournalEntryDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  postings: JournalEntryLineDto[];
}
