import { Global, Module } from "@nestjs/common";
import { DevStorageController } from "./dev-storage.controller";
import { StorageService } from "./storage.service";

@Global()
@Module({
  controllers: [DevStorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
