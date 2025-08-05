import { Module } from '@nestjs/common';
import { ObservationController } from './controllers/observation.controller';
import { ObservationService } from './services/observation.service';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ObservationController],
  providers: [ObservationService],
  exports: [ObservationService],
})
export class ObservationModule {} 