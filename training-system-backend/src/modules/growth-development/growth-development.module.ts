import { Module } from '@nestjs/common';
import { GrowthProfileController } from './controllers/growth-profile.controller';
import { GrowthProfileService } from './services/growth-profile.service';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GrowthProfileController],
  providers: [GrowthProfileService],
  exports: [GrowthProfileService],
})
export class GrowthDevelopmentModule {} 