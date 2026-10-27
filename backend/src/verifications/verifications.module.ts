import { Module } from '@nestjs/common';
import {
  AdminVerificationsController,
  VerificationsController,
} from './verifications.controller.js';
import { VerificationsService } from './verifications.service.js';

@Module({
  controllers: [VerificationsController, AdminVerificationsController],
  providers: [VerificationsService],
})
export class VerificationsModule {}
