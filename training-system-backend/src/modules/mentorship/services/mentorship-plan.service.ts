import { Injectable } from '@nestjs/common';

@Injectable()
export class MentorshipPlanService {
  async findAll(query: any) {
    return { code: 200, data: [], message: '获取带教计划列表成功' };
  }

  async findOne(id: string) {
    return { code: 200, data: { id }, message: '获取带教计划详情成功' };
  }

  async create(createDto: any) {
    return { code: 201, data: { id: `plan-${Date.now()}`, ...createDto }, message: '带教计划创建成功' };
  }

  async update(id: string, updateDto: any) {
    return { code: 200, data: { id, ...updateDto }, message: '带教计划更新成功' };
  }

  async remove(id: string) {
    return { code: 200, message: '带教计划删除成功' };
  }
} 