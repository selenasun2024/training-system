import { Module } from '@nestjs/common';
import { ProjectService } from './services/project.service';
import { BudgetService } from './services/budget.service';
import { ResourceService } from './services/resource.service';
import { ProjectTypeService } from './services/project-type.service';
import { TaskService } from './services/task.service';
import { ScoreService } from './services/score.service';
import { ProposalService } from './services/proposal.service';
import { ProjectMentorshipService } from './services/project-mentorship.service';
import { ProjectController } from './controllers/project.controller';
import { StageController } from './controllers/stage.controller';
import { BudgetController, BudgetSummaryController } from './controllers/budget.controller';
import { ResourceController } from './controllers/resource.controller';
import { ProjectTypeController } from './controllers/project-type.controller';
import { TaskController } from './controllers/task.controller';
import { ScoreController } from './controllers/score.controller';
import { ProposalController } from './controllers/proposal.controller';
import { ProjectMentorshipController } from './controllers/project-mentorship.controller';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';
import { GroupModule } from './group/group.module';

@Module({
  imports: [DatabaseModule, GroupModule],
  controllers: [
    ProjectController,
    StageController,
    BudgetController,
    BudgetSummaryController,
    ResourceController,
    ProjectTypeController,
    TaskController,
    ScoreController,
    ProposalController,
    ProjectMentorshipController,
  ],
  providers: [ProjectService, BudgetService, ResourceService, ProjectTypeService, TaskService, ScoreService, ProposalService, ProjectMentorshipService],
  exports: [ProjectService, BudgetService, ResourceService, ProjectTypeService, TaskService, ScoreService, ProposalService, ProjectMentorshipService],
})
export class ProjectManagementModule {} 