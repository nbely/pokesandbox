import fs from "fs";

export default function readFiles(dir: string, filesList: any[] = []) {
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
        filesList.push(readFiles(filePath));
      } else {
        if (filePath.endsWith("index.ts")) {
          filesList.push(filePath);
        }
      }
  });
  return filesList;
};
