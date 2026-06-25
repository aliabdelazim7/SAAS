import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto, CreateTaskDto, UpdateTaskDto } from '@crm/dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermission } from '../rbac/decorators/permission.decorator';

@Controller('projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @RequirePermission('projects', 'create')
  async create(@Body() createDto: CreateProjectDto) {
    return this.projectService.create(createDto);
  }

  @Get()
  @RequirePermission('projects', 'view')
  async findAll() {
    return this.projectService.findAll();
  }

  @Get(':id')
  @RequirePermission('projects', 'view')
  async findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('projects', 'edit')
  async update(@Param('id') id: string, @Body() updateDto: UpdateProjectDto) {
    return this.projectService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission('projects', 'delete')
  async remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }

  // --- TASKS SUB-API ---
  @Post(':id/tasks')
  @RequirePermission('projects', 'create')
  async createTask(@Param('id') projectId: string, @Body() createTaskDto: CreateTaskDto) {
    return this.projectService.createTask(projectId, createTaskDto);
  }

  @Get(':id/tasks')
  @RequirePermission('projects', 'view')
  async getTasks(@Param('id') projectId: string) {
    return this.projectService.findTasks(projectId);
  }

  @Patch(':id/tasks/:taskId')
  @RequirePermission('projects', 'edit')
  async updateTask(
    @Param('id') projectId: string,
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto
  ) {
    return this.projectService.updateTask(taskId, updateTaskDto);
  }

  @Delete(':id/tasks/:taskId')
  @RequirePermission('projects', 'delete')
  async deleteTask(@Param('id') projectId: string, @Param('taskId') taskId: string) {
    return this.projectService.removeTask(taskId);
  }

  // --- PROJECT MATERIALS ---
  @Post(':id/materials')
  @RequirePermission('projects', 'edit')
  async addMaterial(@Param('id') projectId: string, @Body() dto: any) {
    return this.projectService.addMaterial(projectId, dto);
  }

  @Delete(':id/materials/:materialId')
  @RequirePermission('projects', 'edit')
  async removeMaterial(@Param('id') projectId: string, @Param('materialId') materialId: string) {
    return this.projectService.removeMaterial(projectId, materialId);
  }

  @Get(':id/materials')
  @RequirePermission('projects', 'view')
  async getMaterials(@Param('id') projectId: string) {
    return this.projectService.findMaterials(projectId);
  }

  // --- MEASUREMENT HISTORY ---
  @Get(':id/measurement-history')
  @RequirePermission('projects', 'view')
  async getMeasurementHistory(@Param('id') projectId: string) {
    return this.projectService.getMeasurementHistory(projectId);
  }
}

