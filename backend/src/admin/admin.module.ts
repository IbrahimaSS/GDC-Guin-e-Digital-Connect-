import { Module } from '@nestjs/common';
import { DemandesModule } from '../demandes/demandes.module.js';
import { AdminController, SignalementsController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [DemandesModule],
  controllers: [AdminController, SignalementsController],
  providers: [AdminService],
})
export class AdminModule {}
