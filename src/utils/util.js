const bcrypt = require("bcryptjs");
const { Buffer } = require("node:buffer");
const { format } = require("date-fns");
const { prisma } = require("../config/prisma");
const { decode } = require("base64-arraybuffer");

const hashPassword = async (password) => {
  const SALT = 10;

  return bcrypt.hash(password, SALT);
};

const comparePassword = async (storedPassword, inputPassword) => {
  return bcrypt.compare(inputPassword, storedPassword);
};

const getAllFolders = async (path) => {
  return folders;
};

const createFolder = async (folderName, userId, parentId = null) => {
  const query = parentId
    ? prisma.folder.create({
        data: {
          name: folderName,
          user: {
            connect: {
              id: userId,
            },
          },
          ...(parentId && { parent: { connect: { id: parentId } } }),
        },
      })
    : prisma.folder.create({
        data: {
          name: folderName,
          user: {
            connect: {
              id: userId,
            },
          },
        },
      });

  return query;
};

const getUploadableFile = (file) => {
  if (!file) return;

  const uploadedFileBuffer = file.buffer;
  const fileName = sanitizeFileName(file.originalname);
  const mimetype = file.mimetype; // file type
  const fileBase64 = decode(uploadedFileBuffer.toString("base64"));

  return { fileName, type: mimetype, file: fileBase64 };
};

const sanitizeFileName = (fileName) => {
  return fileName
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^\w.-]/g, ""); // Remove special characters except for . and -
};

const formatFileSize = (bytes) => {
  if (bytes < 0) return "0 KB";

  const KB = 1024;
  const MB = KB * 1024;

  if (bytes < MB) {
    return `${(bytes / KB).toFixed(1)} KB`;
  } else {
    return `${(bytes / MB).toFixed(1)} MB`;
  }
};

const formatDate = (date) => {
  return format(date, "MMM d, yyyy 'at' h:mm a");
};

const getFileBufferForDownload = async (blob) => {
  return Buffer.from(await blob.arrayBuffer());
};

module.exports = {
  hashPassword,
  comparePassword,
  getAllFolders,
  createFolder,
  getUploadableFile,
  sanitizeFileName,
  formatFileSize,
  formatDate,
  getFileBufferForDownload,
};
