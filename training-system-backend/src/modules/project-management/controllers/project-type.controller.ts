import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProjectTypeService } from '../services/project-type.service';
import { CreateProjectTypeDto, UpdateProjectTypeDto, QueryProjectTypeDto } from '../dto/project-type.dto';

@Controller('project-types')
export class ProjectTypeController {
  constructor(private readonly projectTypeService: ProjectTypeService) {}

  /**
   * 获取项目类型列表
   */
  @Get()
  async getProjectTypes(@Query() query: QueryProjectTypeDto) {
    return this.projectTypeService.getProjectTypes(query);
  }

  /**
   * 获取单个项目类型
   */
  @Get(':id')
  async getProjectType(@Param('id') id: string) {
    return this.projectTypeService.getProjectType(id);
  }

  /**
   * 创建项目类型
   */
  @Post()
  async createProjectType(@Body() createDto: CreateProjectTypeDto) {
    return this.projectTypeService.createProjectType(createDto);
  }

  /**
   * 更新项目类型
   */
  @Put(':id')
  async updateProjectType(
    @Param('id') id: string,
    @Body() updateDto: UpdateProjectTypeDto,
  ) {
    return this.projectTypeService.updateProjectType(id, updateDto);
  }

  /**
   * 删除项目类型
   */
  @Delete(':id')
  async deleteProjectType(@Param('id') id: string) {
    return this.projectTypeService.deleteProjectType(id);
  }

  /**
   * 批量更新项目类型排序
   */
  @Put('batch/reorder')
  async reorderProjectTypes(@Body() data: { ids: string[] }) {
    return this.projectTypeService.reorderProjectTypes(data.ids);
  }
} 