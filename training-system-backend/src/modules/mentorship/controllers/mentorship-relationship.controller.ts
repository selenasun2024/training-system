import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { MentorshipRelationshipService } from '../services/mentorship-relationship.service';

@Controller('mentorship/relationships')
export class MentorshipRelationshipController {
  constructor(private readonly service: MentorshipRelationshipService) {}

  @Get()
  async findAll(@Query() query: any) {
    return await this.service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.service.findOne(id);
  }

  @Post()
  async create(@Body() createDto: any) {
    return await this.service.create(createDto);
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