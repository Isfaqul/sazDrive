const { Router } = require("express");
const controller = require("../controllers/driveController");

const driveRouter = Router();

// Home
driveRouter.get("/", controller.allDataGet);

// Root Folder Creation
driveRouter.get("/folder/create", controller.createFolderGet);
driveRouter.post("/folder/create", controller.createFolderPost);

// Folder routes
driveRouter.get("/folder/:folderId", controller.folderGet);
driveRouter.get("/folder/:folderId/create", controller.createFolderGet);
driveRouter.post("/folder/:folderId/create", controller.createFolderPost);

// Upload file
driveRouter.get("/upload", controller.uploadFileGet);
driveRouter.post("/upload", controller.uploadFilePost);

// View file
driveRouter.get("/file/:fileId", controller.fileViewGet);
driveRouter.get("/folder/:folderId/file/:fileId", controller.fileViewGet);

// Edit folder name
driveRouter.get("/folder/:folderId/edit", controller.editFolderGet);
driveRouter.post("/folder/:folderId/edit", controller.editFolderPost);

// Edit file name
driveRouter.get("/file/:fileId/edit", controller.editFileGet);
driveRouter.post("/file/:fileId/edit", controller.editFilePost);

driveRouter.get("/folder/:folderId/file/:fileId/edit", controller.editFileGet);
driveRouter.post(
  "/folder/:folderId/file/:fileId/edit",
  controller.editFilePost,
);

// Delete files and folder
driveRouter.post("/folder/:folderId/delete", controller.folderDeletePost);
driveRouter.post("/file/:fileId/delete", controller.fileDeletePost);
driveRouter.post(
  "/folder/:folderId/file/:fileId/delete",
  controller.fileDeletePost,
);

// Download files
driveRouter.post("/file/:fileId/download", controller.downloadFilePost);
driveRouter.post(
  "/folder/:folderId/file/:fileId/download",
  controller.downloadFilePost,
);

module.exports = driveRouter;
