const {
  createFolder,
  getUploadableFile,
  formatFileSize,
  formatDate,
  getFileBufferForDownload,
} = require("../utils/util");
const { folderNameValidation, validationResult } = require("../middlewares/validator");
const { prisma } = require("../config/prisma");
const supabase = require("../config/supabase");
const upload = require("../middlewares/multer");
const path = require("path");
const multer = require("multer");

const allDataGet = async (req, res, next) => {
  if (!req.user) {
    res.redirect("/auth/login");
    return;
  }

  let files = [];
  let folders = [];

  try {
    files = await prisma.file.findMany({
      where: {
        folderId: null,
        userId: req.user.id,
      },
    });

    folders = await prisma.folder.findMany({
      where: {
        parentId: null,
        userId: req.user.id,
      },
    });
  } catch (error) {
    res.status(500).render("pages/404", { title: "Error", error });
  }

  res.render("pages/driveHome", {
    title: "Home",
    folders: folders,
    files: files,
    isLoggedIn: req.user ? true : false,
    name: req.user.firstName,
  });
};

const folderGet = async (req, res, next) => {
  if (!req.user) {
    res.redirect("/auth/login");
    return;
  }

  let currentFolder;
  let files = [];

  try {
    currentFolder = await prisma.folder.findFirst({
      where: {
        id: +req.params.folderId,
      },
    });

    files = await prisma.file.findMany({
      where: {
        userId: req.user.id,
        folderId: +req.params.folderId,
      },
    });

    res.render("pages/dynamicFolderView", {
      title: currentFolder.name,
      folderId: currentFolder.id,
      files: files,
      isLoggedIn: req.user ? true : false,
    });
  } catch (error) {
    res.status(500).render("pages/404", { title: "Error", error });
  }
};

const createFolderGet = (req, res, next) => {
  if (!req.user) {
    res.redirect("/auth/login");
    return;
  }

  res.render("pages/createFolder", { title: "Create folder", errors: [] });
};

const createFolderPost = [
  folderNameValidation,
  async (req, res, next) => {
    if (!req.user) {
      res.redirect("/auth/login");
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("pages/createFolder", { title: "Create folder", errors: errors.array() });
      return;
    }

    try {
      const folderData = await createFolder(req.body.folderName, req.user.id);
      res.redirect(`${folderData.id}`);
    } catch (error) {
      res.render("pages/createFolder", {
        title: "Create folder",
        errors: [{ msg: "Unable to create folder. Please try again." }],
      });
    }
  },
];

const uploadFileGet = (req, res, next) => {
  if (!req.user) {
    res.redirect("/auth/login");
    return;
  }

  res.render("pages/fileUpload", { title: "Upload your file", errors: [], folderId: req.query.folderId || null });
};

const uploadFilePost = [
  upload.single("file"),
  // Multer error handler
  (err, req, res, next) => {
    if (!req.user) {
      res.redirect("/auth/login");
      return;
    }

    if (err) {
      if (err instanceof multer.MulterError) {
        // handle multer-specific errors (file too large, unexpected field, etc.)
        let message = "Upload failed. Please try again.";
        if (err.code === "LIMIT_FILE_SIZE") {
          message = "Upload failed. File is too large. Max alllowed : 5 MB";
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
          message = "Upload failed. Unexpected file field.";
        }
        // render upload page with error and preserve folderId if present
        return res.render("pages/fileUpload", {
          title: "Upload your file",
          errors: [{ msg: message }],
          folderId: req.body.folderId || req.query.folderId || null,
        });
      }
      // non-multer error -> pass along
      return next(err);
    }

    // no error from multer -> proceed to next middleware
    next();
  },
  async (req, res, next) => {
    if (!req.user) {
      res.redirect("/auth/login");
      return;
    }

    if (!req.file) {
      res.render("pages/fileUpload", {
        title: "Upload your file",
        errors: [{ msg: "Unable to upload file. Please try again" }],
        folderId: req.body.folderId || null,
      });
      return;
    }

    const { fileName, type, file } = getUploadableFile(req.file);
    const folderId = req.body.folderId;
    const PATH = `${req.user.id}/${folderId ? `${folderId}/` : ""}`;

    try {
      // Upload file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(PATH + fileName, file, { contentType: type, upsert: false });

      if (uploadError) throw uploadError;

      // Get public url
      const { data: publicUrlData, error: publicUrlError } = await supabase.storage
        .from("uploads")
        .getPublicUrl(uploadData.path);

      if (publicUrlError) throw publicUrlError;

      // Store image url in Prisma
      if (folderId) {
        await prisma.file.create({
          data: {
            id: uploadData.id,
            name: fileName,
            url: publicUrlData.publicUrl,
            folder: {
              connect: {
                id: +folderId,
              },
            },
            user: {
              connect: {
                id: req.user.id,
              },
            },
          },
        });

        res.redirect(`/drive/folder/${folderId}`);
      } else {
        await prisma.file.create({
          data: {
            id: uploadData.id,
            name: fileName,
            url: publicUrlData.publicUrl,
            user: {
              connect: {
                id: req.user.id,
              },
            },
          },
        });

        res.redirect(`/drive`);
      }
    } catch (error) {
      let errorMessage;
      if (error.statusCode === "415") {
        errorMessage = `Upload failed. File type not supported. Only images are supported at the moment.`;
      } else {
        errorMessage = "Upload failed. Please try again.";
      }

      res.render("pages/fileUpload", {
        title: "Upload your file",
        errors: [{ msg: errorMessage }],
        folderId: folderId || null,
      });

      console.log("Upload failed. " + error.message || error);
      return;
    }
  },
];

const folderDeletePost = async (req, res, next) => {
  if (!req.user) {
    res.redirect("/auth/login");
    return;
  }

  const folderId = +req.params.folderId;
  const userId = +req.user.id;

  try {
    const data = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: userId,
      },
      include: {
        file: true,
      },
    });

    if (data.userId !== userId) throw new Error("Unauthorized!");

    // If empty folder as per prisma db, only update prisma db
    if (!data.file.length) {
      await prisma.folder.delete({
        where: {
          id: folderId,
          userId: userId,
        },
      });

      res.redirect("/drive");
      return;
    }

    const { data: supabaseData, error: supabaseError } = await supabase.storage
      .from("uploads")
      .list(`${userId}/${folderId}`);

    const filePaths = [];

    // Build paths to delete
    supabaseData.forEach((file) => {
      const ROOT_PATH = `${req.user.id}/${folderId}/`;
      const path = ROOT_PATH + file.name;
      filePaths.push(path);
    });

    const { data: fileDeleteData, error: filesDeleteError } = await supabase.storage.from("uploads").remove(filePaths);
    if (filesDeleteError) throw filesDeleteError;

    // Delete files first
    await prisma.file.deleteMany({
      where: {
        folderId: folderId,
        userId: userId,
      },
    });

    // Delete folder
    await prisma.folder.delete({
      where: {
        id: folderId,
        userId: userId,
      },
    });

    res.redirect("/drive");
  } catch (error) {
    console.log(error);
    res.status(500).render("pages/404", { title: "Error", error });
  }
};

const fileDeletePost = async (req, res, next) => {
  if (!req.user) {
    res.redirect("/auth/login");
    return;
  }

  const fileId = req.params.fileId;
  const folderId = req.params.folderId;

  try {
    const { name, userId } = await prisma.file.findFirst({
      where: {
        id: fileId,
      },
    });

    if (userId !== req.user.id) throw new Error("Unauthorized!");

    // Build file path
    const FILE_PATH = folderId ? `${req.user.id}/${folderId}/${name}` : `${req.user.id}/${name}`;

    const { data: removeFileData, error: removeFileError } = await supabase.storage.from("uploads").remove(FILE_PATH);
    if (removeFileError) throw removeFileError;

    await prisma.file.delete({
      where: {
        id: fileId,
      },
    });

    const redirectRoute = folderId ? `/drive/folder/${folderId}` : `/drive`;

    res.redirect(redirectRoute);
  } catch (error) {
    console.log(error);
    res.status(500).render("pages/404", { title: "Error", error });
  }
};

const downloadFilePost = async (req, res, next) => {
  if (!req.user) {
    res.redirect("/auth/login");
    return;
  }

  const fileId = req.params.fileId;
  const folderId = req.params.folderId;

  try {
    const { name, userId } = await prisma.file.findFirst({
      where: {
        id: fileId,
      },
    });

    if (userId !== req.user.id) throw new Error("Unauthorized!");

    // Build file path for download
    const FILE_PATH = folderId ? `${req.user.id}/${folderId}/${name}` : `${req.user.id}/${name}`;

    const { data: downloadData, error: downloadError } = await supabase.storage.from("uploads").download(FILE_PATH);
    if (downloadError) throw downloadError;

    const dowloadFile = await getFileBufferForDownload(downloadData);

    res.setHeader("Content-Type", downloadData.type);
    res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
    res.send(dowloadFile);
  } catch (error) {
    console.log(error);
  }
};

const fileViewGet = async (req, res, next) => {
  if (!req.user) {
    res.redirect("/auth/login");
    return;
  }

  const fileId = req.params.fileId;
  const folderId = +req.params.folderId || null;
  const userId = +req.user.id;

  try {
    const image = await prisma.file.findFirst({
      where: {
        id: fileId,
        folderId: folderId,
        userId: userId,
      },
    });

    const FILE_PATH = folderId ? `${userId}/${folderId}/${image.name}` : `${userId}/${image.name}`;

    const { data: imageInfo, error: imageInfoError } = await supabase.storage.from("uploads").info(FILE_PATH);
    console.log(imageInfo);

    const metaData = {
      Name: image.name,
      Size: formatFileSize(imageInfo.size),
      Type: imageInfo.contentType,
      "Uploaded On": formatDate(imageInfo.createdAt),
    };

    res.render("pages/fileView", { title: "FileName", metaData, file: image });
  } catch (error) {
    console.log(error);
    res.status(500).render("pages/404", { title: "Error", error });
  }
};

const editFolderGet = async (req, res, next) => {
  if (!req.user) {
    res.redirect("/auth/login");
    return;
  }

  const folderId = +req.params.folderId;
  const backUrl = req.get("Referer") || "/drive";

  try {
    const { name } = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: +req.user.id,
      },
    });

    res.render("pages/editFolderForm", {
      title: "Edit Name",
      errors: [],
      folder: { id: folderId, name: name },
      backUrl,
    });
  } catch (error) {
    console.log(error);
    res.status(500).render("pages/404", { title: "Error", error });
  }
};

const editFolderPost = [
  folderNameValidation,
  async (req, res, next) => {
    if (!req.user) {
      res.redirect("/auth/login");
      return;
    }

    const folderId = +req.body.id;
    const userId = +req.user.id;
    let folderName = "";

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const folder = await prisma.folder.findFirst({
          where: {
            id: folderId,
            userId: userId,
          },
        });

        folderName = folder.name;

        res.render("pages/editFolderForm", {
          title: "Edit Name",
          errors: errors.array(),
          folder: { id: folderId, name: folderName },
        });

        return;
      }

      // Update folderName

      await prisma.folder.update({
        where: {
          id: folderId,
          userId: userId,
        },
        data: {
          name: req.body.folderName,
        },
      });

      res.redirect("/drive");
    } catch (error) {
      res.render("pages/editFolderForm", {
        title: "Edit Name",
        errors: [{ msg: "Failed to update name. Please try again." }],
        folder: { id: folderId, name: folderName },
      });
    }
  },
];

const editFileGet = async (req, res, next) => {
  if (!req.user) {
    res.redirect("/auth/login");
    return;
  }

  const folderId = +req.params.folderId || null;
  const fileId = req.params.fileId || null;
  const userId = +req.user.id;
  let fileName = "";

  const backUrl = req.get("Referer") || "/drive";
  console.log(backUrl);

  try {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        folderId: folderId,
        userId: userId,
      },
    });

    fileName = file.name;

    res.render("pages/editFileForm", {
      title: "Update file name",
      errors: [],
      file: { name: fileName, id: fileId, folderId: folderId },
      backUrl,
    });
  } catch (error) {
    console.log(error);
    res.status(500).render("pages/404", { title: "Error", error });
  }
};

const editFilePost = async (req, res, next) => {
  if (!req.user) {
    res.redirect("/auth/login");
    return;
  }

  const folderId = +req.body.folderId || null;
  const fileId = req.body.fileId || null;
  const userId = +req.user.id;
  let newFileName = req.body.fileName;

  try {
    const currentFile = await prisma.file.findFirst({
      where: {
        id: fileId,
        folderId: folderId,
        userId: userId,
      },
    });

    const currentFileName = currentFile.name;
    const ext = path.extname(currentFileName);

    // If user did not provide extension, append the original extension
    if (!newFileName.endsWith(ext)) {
      // Remove any extension the user might have typed
      newFileName = path.basename(newFileName, path.extname(newFileName)) + ext;
    }

    const CURRENT_PATH = folderId ? `${userId}/${folderId}/${currentFileName}` : `${userId}/${currentFileName}`;
    const RENAMED_PATH = folderId ? `${userId}/${folderId}/${newFileName}` : `${userId}/${newFileName}`;

    const { data: nameUpdateData, error: nameUpdateError } = await supabase.storage
      .from("uploads")
      .move(CURRENT_PATH, RENAMED_PATH);

    if (nameUpdateError) throw nameUpdateError;

    const { data: updatedFileData, error: updatedFileError } = await supabase.storage
      .from("uploads")
      .getPublicUrl(RENAMED_PATH);

    if (updatedFileError) throw updatedFileError;

    const { data: updatedFileNameData, error: updatedFileNameDataError } = await supabase.storage
      .from("uploads")
      .info(RENAMED_PATH);

    if (updatedFileNameDataError) throw updatedFileNameDataError;

    await prisma.file.update({
      where: {
        id: fileId,
        folderId: folderId,
        userId: userId,
      },
      data: {
        name: newFileName,
        url: updatedFileData.publicUrl,
      },
    });

    const redirectRoute = folderId ? `/drive/folder/${folderId}` : `/drive`;

    res.redirect(redirectRoute);
  } catch (error) {
    console.log(error);
    res.status(500).render("pages/404", { title: "Error", error });
  }
};

module.exports = {
  allDataGet,
  folderGet,
  createFolderGet,
  createFolderPost,
  uploadFileGet,
  uploadFilePost,
  folderDeletePost,
  fileDeletePost,
  downloadFilePost,
  fileViewGet,
  editFolderGet,
  editFolderPost,
  editFileGet,
  editFilePost,
};
