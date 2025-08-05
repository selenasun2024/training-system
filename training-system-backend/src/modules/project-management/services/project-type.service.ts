import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { CreateProjectTypeDto, UpdateProjectTypeDto, QueryProjectTypeDto } from '../dto/project-type.dto';
import { customAlphabet } from 'nanoid';

@Injectable()
export class ProjectTypeService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjectTypes(query: QueryProjectTypeDto = {}) {
    const { enabled, isSystem, search, orderBy = 'orderIndex', sortOrder = 'asc' } = query;

    const where: any = {};
    
    if (enabled !== undefined) {
      where.enabled = enabled;
    }
    
    if (isSystem !== undefined) {
      where.isSystem = isSystem;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const projectTypes = await this.prisma.projectType.findMany({
      where,
      orderBy: { [orderBy]: sortOrder }
    });

    return {
      success: true,
      data: projectTypes,
      total: projectTypes.length
    };
  }

  async getProjectType(id: string): Promise<{ success: boolean; data: any }> {
    const projectType = await this.prisma.projectType.findUnique({
      where: { id }
    });

    if (!projectType) {
      throw new NotFoundException(`ProjectType with ID ${id} not found`);
    }

    return {
      success: true,
      data: projectType
    };
  }

  async getProjectTypeByCode(code: string): Promise<any | null> {
    return this.prisma.projectType.findUnique({
      where: { code }
    });
  }

  async createProjectType(createDto: CreateProjectTypeDto): Promise<{ success: boolean; data: any }> {
    let code = createDto.code;

    // 如果code为空，则自动生成一个
    if (!code) {
      const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);
      code = `type_${nanoid()}`;
    }

    // 检查代码是否已存在
    const existingType = await this.prisma.projectType.findUnique({
      where: { code }
    });

    if (existingType) {
      throw new ConflictException(`项目类型代码'${code}'已存在`);
    }

    // 如果没有指定排序，使用最大值+1
    let orderIndex = createDto.orderIndex;
    if (!orderIndex) {
      const maxOrder = await this.prisma.projectType.aggregate({
        _max: { orderIndex: true }
      });
      orderIndex = (maxOrder._max.orderIndex || 0) + 1;
    }

    const projectType = await this.prisma.projectType.create({
      data: {
        name: createDto.name,
        code: code, // 使用处理过的code
        description: createDto.description,
        remindDays: createDto.remindDays || 7,
        enabled: createDto.enabled !== undefined ? createDto.enabled : true,
        orderIndex: orderIndex,
        isSystem: false, // 新创建的类型默认不是系统类型
        config: {},
        stageTemplateIds: [],
        taskTemplateIds: [],
        filterRules: []
      }
    });

    return {
      success: true,
      data: projectType
    };
  }

  async updateProjectType(id: string, updateDto: UpdateProjectTypeDto): Promise<{ success: boolean; data: any }> {
    const existingType = await this.prisma.projectType.findUnique({
      where: { id }
    });
    
    if (!existingType) {
      throw new NotFoundException(`ProjectType with ID ${id} not found`);
    }

    // 如果更新代码，检查是否冲突
    if (updateDto.code && updateDto.code !== existingType.code) {
      const existingCode = await this.prisma.projectType.findUnique({
        where: { code: updateDto.code }
      });
      
      if (existingCode) {
        throw new ConflictException(`项目类型代码'${updateDto.code}'已存在`);
      }
    }

    const projectType = await this.prisma.projectType.update({
      where: { id },
      data: {
        ...(updateDto.name && { name: updateDto.name }),
        ...(updateDto.code && { code: updateDto.code }),
        ...(updateDto.description !== undefined && { description: updateDto.description }),
        ...(updateDto.remindDays !== undefined && { remindDays: updateDto.remindDays }),
        ...(updateDto.enabled !== undefined && { enabled: updateDto.enabled }),
        ...(updateDto.orderIndex !== undefined && { orderIndex: updateDto.orderIndex })
      }
    });

    return {
      success: true,
      data: projectType
    };
  }

  async deleteProjectType(id: string): Promise<{ success: boolean; message: string }> {
    const existingType = await this.prisma.projectType.findUnique({
      where: { id }
    });

    if (!existingType) {
      throw new NotFoundException(`ProjectType with ID ${id} not found`);
    }

    // 检查是否被项目使用
    const projectsUsingType = await this.prisma.trainingProject.count({
      where: { type: id }
    });

    if (projectsUsingType > 0) {
      throw new ConflictException(`无法删除项目类型'${existingType.name}'，因为它正被 ${projectsUsingType} 个项目使用`);
    }

    await this.prisma.projectType.delete({
      where: { id }
    });

    return {
      success: true,
      message: `ProjectType ${existingType.name} deleted successfully`
    };
  }

  async reorderProjectTypes(ids: string[]): Promise<{ success: boolean; data: any[] }> {
    // 批量更新排序
    const updatePromises = ids.map((id, index) => 
      this.prisma.projectType.update({
        where: { id },
        data: { orderIndex: index + 1 }
      })
    );

    await Promise.all(updatePromises);

    const projectTypes = await this.prisma.projectType.findMany({
      orderBy: { orderIndex: 'asc' }
    });

    return {
      success: true,
      data: projectTypes
    };
  }

  async toggleProjectTypeStatus(id: string): Promise<{ success: boolean; data: any }> {
    const existingType = await this.prisma.projectType.findUnique({
      where: { id }
    });
    
    if (!existingType) {
      throw new NotFoundException(`ProjectType with ID ${id} not found`);
    }

    const projectType = await this.prisma.projectType.update({
      where: { id },
      data: { enabled: !existingType.enabled }
    });

    return {
      success: true,
      data: projectType
    };
  }

  // 获取项目类型的统计信息
  async getProjectTypeStats() {
    const total = await this.prisma.projectType.count();
    const enabled = await this.prisma.projectType.count({
      where: { enabled: true }
    });
    const system = await this.prisma.projectType.count({
      where: { isSystem: true }
    });

    return {
      success: true,
      data: {
        total,
        enabled,
        disabled: total - enabled,
        system,
        custom: total - system
      }
    };
  }
} 