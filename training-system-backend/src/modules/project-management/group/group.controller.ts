import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Controller()
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post('projects/:projectId/groups')
  @HttpCode(HttpStatus.CREATED)
  async createGroup(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    // 确保DTO中的projectId与URL参数一致
    const dtoWithProjectId = { ...createGroupDto, projectId };
    const group = await this.groupService.createGroup(dtoWithProjectId);
    return {
      code: HttpStatus.CREATED,
      message: '小组创建成功',
      data: group,
    };
  }

  @Get('projects/:projectId/groups')
  async getGroupsByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    const groups = await this.groupService.getGroupsByProject(projectId);
    return {
      code: HttpStatus.OK,
      message: '获取项目小组列表成功',
      data: groups,
    };
  }

  @Put('groups/:groupId')
  async updateGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    const updatedGroup = await this.groupService.updateGroup(groupId, updateGroupDto);
    return {
      code: HttpStatus.OK,
      message: '小组信息更新成功',
      data: updatedGroup,
    };
  }

  @Delete('groups/:groupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGroup(@Param('groupId', ParseUUIDPipe) groupId: string) {
    await this.groupService.deleteGroup(groupId);
  }

  @Post('groups/:groupId/members')
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    const member = await this.groupService.addMember(groupId, addMemberDto);
    return {
      code: HttpStatus.CREATED,
      message: '小组成员添加成功',
      data: member,
    };
  }

  @Delete('groups/:groupId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('userId') userId: string,
  ) {
    await this.groupService.removeMember(groupId, userId);
  }
}
