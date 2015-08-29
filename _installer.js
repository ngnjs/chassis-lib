var fs = require('fs'),
    path = require('path'),
    wrench = require('wrench');

var root = path.join(process.cwd(),'chassis');

// Copy files to new directory
wrench.copyDirSyncRecursive(path.join(__dirname,'lib'), root, {
  forceDelete: true, // Whether to overwrite existing directory or not
  excludeHiddenUnix: true, // Whether to copy hidden Unix files or not (preceding .)
  preserveFiles: false, // If we're overwriting something and the file already exists, keep the existing
  preserveTimestamps: true, // Preserve the mtime and atime when copying files
  inflateSymlinks: true // Whether to follow symlinks or not when copying files
});

wrench.rmdirSyncRecursive(__dirname);
