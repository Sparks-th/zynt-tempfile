export interface FileDocument {
  fileId: string;
  hash: string;
  bucket: "temp" | "perm";
  objectKey: string;
  size: number;
  mime: string;
  createdAt: Date;
  expiresAt?: Date | null;
  referenceCount: number;
  deleteToken: string;
}
