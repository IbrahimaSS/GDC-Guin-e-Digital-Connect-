import { Module } from '@nestjs/common';
import { DemandesModule } from '../demandes/demandes.module.js';
import { MessagesController } from './messages.controller.js';
import { MessagesGateway } from './messages.gateway.js';
import { MessagesService } from './messages.service.js';

@Module({
  imports: [DemandesModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
})
export class MessagesModule {}
