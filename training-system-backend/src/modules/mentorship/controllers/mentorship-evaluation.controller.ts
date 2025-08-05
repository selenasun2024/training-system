import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { MentorshipEvaluationService } from '../services/mentorship-evaluation.service';

@Controller('mentorship/evaluations')
export class MentorshipEvaluationController {
  constructor(private readonly service: MentorshipEvaluationService) {}

  @Get()
  async findAll(@Query() query: any) {
    return await this.service.findAll(query);
  }

  @Get('stats')
  async getStats() {
    return await this.service.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.service.findOne(id);
  }

  @Get(':id/followup')
  async getFollowupRecord(@Param('id') id: string) {
    return await this.service.getFollowupRecord(id);
  }

  @Post()
  async create(@Body() createDto: any) {
    return await this.service.create(createDto);
  }

  @Post(':id/followup')
  async submitFollowup(@Param('id') id: string, @Body() followupData: any) {
    return await this.service.submitFollowup(id, followupData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return await this.service.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.service.remove(id);
  }
} 