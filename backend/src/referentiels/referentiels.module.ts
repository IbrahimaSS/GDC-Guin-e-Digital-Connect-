import { Module } from '@nestjs/common';
import {
  AdminReferentielsController,
  ReferentielsController,
} from './referentiels.controller.js';
import { ReferentielsService } from './referentiels.service.js';

@Module({
  controllers: [ReferentielsController, AdminReferentielsController],
  providers: [ReferentielsService],
})
export class ReferentielsModule {}
