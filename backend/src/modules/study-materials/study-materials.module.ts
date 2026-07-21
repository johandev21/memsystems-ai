import { Module } from '@nestjs/common';
import { NotebooksModule } from '../notebooks/notebooks.module';
import { GenerationRequestManager } from './generation-request-manager';
import { GenerationService } from './generation.service';

import { StreamHandler } from './stream-handler';
import { StudyMaterialFolderService } from './study-material-folder.service';
import { StudyMaterialService } from './study-material.service';
import { StudyMaterialsController } from './study-materials.controller';
import { TrashService } from './trash.service';

@Module({
  imports: [NotebooksModule],
  controllers: [StudyMaterialsController],
  providers: [
    StudyMaterialService,
    StudyMaterialFolderService,
    TrashService,
    GenerationRequestManager,
    StreamHandler,
    GenerationService,
  ],
  exports: [
    StudyMaterialService,
    StudyMaterialFolderService,
    TrashService,
    GenerationService,
  ],
})
export class StudyMaterialsModule {}
