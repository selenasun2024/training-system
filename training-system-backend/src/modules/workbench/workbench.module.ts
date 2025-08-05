import { Module } from '@nestjs/common';
import { DashboardService } from './services/dashboard.service';
import { MentorWorkbenchService } from './services/mentor-workbench.service';
import { WorkbenchController } from './controllers/workbench.controller';
import { MentorWorkbenchController } from './controllers/mentor-workbench.controller';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [WorkbenchController, MentorWorkbenchController],
  providers: [DashboardService, MentorWorkbenchService],
  exports: [DashboardService, MentorWorkbenchService],
})
export class WorkbenchModule {} 