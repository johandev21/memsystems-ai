import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AiModule } from "./modules/ai/ai.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ChatModule } from "./modules/chat/chat.module";
import { DatabaseModule } from "./modules/database/database.module";
import { NotebooksModule } from "./modules/notebooks/notebooks.module";
import { SourcesModule } from "./modules/sources/sources.module";
import { StorageModule } from "./modules/storage/storage.module";
import { StudyMaterialsModule } from "./modules/study-materials/study-materials.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../frontend/.env.local", ".env.local", "../.env.local", ".env"],
    }),
    DatabaseModule,
    AuthModule,
    StorageModule,
    AiModule,
    NotebooksModule,
    SourcesModule,
    ChatModule,
    StudyMaterialsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
