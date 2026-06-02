import { studyMaterialController } from "./study-material.controller";
import { studyMaterialFolderController } from "./study-material-folder.controller";
import { trashController } from "./trash.controller";

export const studyMaterialsModule = [
	studyMaterialController,
	studyMaterialFolderController,
	trashController,
];
