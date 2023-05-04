import fs from "fs";

export function getFilesAsNestedArrays(dir: string, filesList: any[] = []) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const files = fs.readdirSync(dir);
  if (!files) {
    return [];
  }
  files.forEach((file) => {
      const filePath: string = `${dir}/${file}`;
      if (fs.statSync(filePath).isDirectory()) {
        filesList.push(getFilesAsNestedArrays(filePath));
      } else {
        if (filePath.endsWith("index.ts")) {
          filesList.push(filePath);
        }
      }
  });
  return filesList;
};

export function getFilesAsSingleArray(dir: string, filesList: any[] = []) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const files = fs.readdirSync(dir);
  if (!files) {
    return [];
  }
  files.forEach((file) => {
      const filePath: string = `${dir}/${file}`;
      if (fs.statSync(filePath).isDirectory()) {
        filesList = filesList.concat(getFilesAsSingleArray(filePath));
      } else {
        if (filePath.endsWith(".ts")) {
          filesList.push(filePath);
        }
      }
  });
  return filesList;
};
