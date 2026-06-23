import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto, UpdateExpenseDto } from '@crm/dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermission } from '../rbac/decorators/permission.decorator';

@Controller('expenses')
@UseGuards(AuthGuard, PermissionsGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @RequirePermission('finance', 'create')
  async create(@Body() createDto: CreateExpenseDto) {
    return this.expenseService.create(createDto);
  }

  @Get()
  @RequirePermission('finance', 'view')
  async findAll() {
    return this.expenseService.findAll();
  }

  @Get(':id')
  @RequirePermission('finance', 'view')
  async findOne(@Param('id') id: string) {
    return this.expenseService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('finance', 'edit')
  async update(@Param('id') id: string, @Body() updateDto: UpdateExpenseDto) {
    return this.expenseService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission('finance', 'delete')
  async remove(@Param('id') id: string) {
    return this.expenseService.remove(id);
  }
}
