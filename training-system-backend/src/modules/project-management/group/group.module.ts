import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { DatabaseModule } from '../../../shared/infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService]
})
export class GroupModule {}
