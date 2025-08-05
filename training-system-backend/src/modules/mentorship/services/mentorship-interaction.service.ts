import { Injectable } from '@nestjs/common';

@Injectable()
export class MentorshipInteractionService {
  async findAll(query: any) {
    return { code: 200, data: [], message: '获取交互记录列表成功' };
  }

  async findOne(id: string) {
    return { code: 200, data: { id }, message: '获取交互记录详情成功' };
  }

  async create(createDto: any) {
    return { code: 201, data: { id: `interaction-${Date.now()}`, ...createDto }, message: '交互记录创建成功' };
  }

  async update(id: string, updateDto: any) {
    return { code: 200, data: { id, ...updateDto }, message: '交互记录更新成功' };
  }

  async remove(id: string) {
    return { code: 200, message: '交互记录删除成功' };
  }
} 