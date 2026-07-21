import { Global, Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { ChunkingService } from "./chunking.service";
import { ConnectionService } from "./connection.service";
import { EmbeddingService } from "./embedding.service";
import { IndexingService } from "./indexing.service";
import { RetrievalService } from "./retrieval.service";
import { UserSettingsService } from "./user-settings.service";

@Global()
@Module({
  controllers: [AiController],
  providers: [
    UserSettingsService,
    ConnectionService,
    AiService,
    EmbeddingService,
    ChunkingService,
    IndexingService,
    RetrievalService,
  ],
  exports: [
    UserSettingsService,
    ConnectionService,
    AiService,
    EmbeddingService,
    ChunkingService,
    IndexingService,
    RetrievalService,
  ],
})
export class AiModule {}
