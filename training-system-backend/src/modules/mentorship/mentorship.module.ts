import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';

// 控制器
import { MentorshipProjectController } from './controllers/mentorship-project.controller';
import { MentorshipRelationshipController } from './controllers/mentorship-relationship.controller';
import { MentorshipPlanController } from './controllers/mentorship-plan.controller';
import { MentorshipEvaluationController } from './controllers/mentorship-evaluation.controller';
import { MentorshipInteractionController } from './controllers/mentorship-interaction.controller';

// 服务
import { MentorshipProjectService } from './services/mentorship-project.service';
import { MentorshipRelationshipService } from './services/mentorship-relationship.service';
import { MentorshipPlanService } from './services/mentorship-plan.service';
import { MentorshipEvaluationService } from './services/mentorship-evaluation.service';
import { MentorshipInteractionService } from './services/mentorship-interaction.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    MentorshipProjectController,
    MentorshipRelationshipController,
    MentorshipPlanController,
    MentorshipEvaluationController,
    MentorshipInteractionController,
  ],
  providers: [
    MentorshipProjectService,
    MentorshipRelationshipService,
    MentorshipPlanService,
    MentorshipEvaluationService,
    MentorshipInteractionService,
  ],
  exports: [
    MentorshipProjectService,
    MentorshipRelationshipService,
    MentorshipPlanService,
    MentorshipEvaluationService,
    MentorshipInteractionService,
  ],
})
export class MentorshipModule {} 