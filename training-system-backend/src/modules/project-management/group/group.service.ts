import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class GroupService {
  constructor(private readonly prisma: PrismaService) {}

  async createGroup(createGroupDto: CreateGroupDto) {
    const { name, description, projectId } = createGroupDto;

    // 验证项目是否存在
    const project = await this.prisma.trainingProject.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`项目 (ID: ${projectId}) 不存在`);
    }

    const newGroup = await this.prisma.trainingGroup.create({
      data: {
        name,
        description,
        projectId,
      },
    });
    return newGroup;
  }

  async getGroupsByProject(projectId: string) {
    return this.prisma.trainingGroup.findMany({
      where: { projectId },
      include: {
        members: {
          select: {
            role: true,
            assignedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                department: true,
                position: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async updateGroup(groupId: string, updateGroupDto: UpdateGroupDto) {
    const group = await this.prisma.trainingGroup.findUnique({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException(`小组 (ID: ${groupId}) 不存在`);
    }

    return this.prisma.trainingGroup.update({
      where: { id: groupId },
      data: updateGroupDto,
    });
  }

  async deleteGroup(groupId: string) {
    const group = await this.prisma.trainingGroup.findUnique({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException(`小组 (ID: ${groupId}) 不存在`);
    }

    await this.prisma.trainingGroup.delete({
      where: { id: groupId },
    });

    return { message: `小组 (ID: ${groupId}) 已成功删除` };
  }

  async addMember(groupId: string, addMemberDto: AddMemberDto) {
    const { userId, role } = addMemberDto;

    // 检查小组和用户是否存在
    const group = await this.prisma.trainingGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException(`小组 (ID: ${groupId}) 不存在`);
    
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`用户 (ID: ${userId}) 不存在`);

    // 检查用户是否已在小组中
    const existingMember = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (existingMember) {
      throw new ConflictException(`用户 (ID: ${userId}) 已经是该小组成员`);
    }

    return this.prisma.groupMember.create({
      data: {
        groupId,
        userId,
        role,
      },
    });
  }

  async removeMember(groupId: string, userId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!member) {
      throw new NotFoundException(`在小组 (ID: ${groupId}) 中未找到成员 (ID: ${userId})`);
    }

    await this.prisma.groupMember.delete({
      where: { id: member.id },
    });

    return { message: '成员已成功移除' };
  }
}
