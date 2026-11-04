import { Global, Module } from '@nestjs/common';
import { FichiersController } from './fichiers.controller.js';
import { FichiersService } from './fichiers.service.js';

@Global()
@Module({
  controllers: [FichiersController],
  providers: [FichiersService],
  exports: [FichiersService],
})
export class FichiersModule {}
