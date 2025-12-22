import { randomBytes } from "crypto";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const ID_LENGTH = 5;

export function generateFileId(): string {
  let result = "";
  const bytes = randomBytes(ID_LENGTH);
  
  for (let i = 0; i < ID_LENGTH; i++) {
    result += CHARS[bytes[i] % CHARS.length];
  }
  
  return result;
}

export async function generateUniqueFileId(
  checkExists: (id: string) => Promise<boolean>
): Promise<string> {
  const maxAttempts = 10;
  
  for (let i = 0; i < maxAttempts; i++) {
    const fileId = generateFileId();
    const exists = await checkExists(fileId);
    
    if (!exists) {
      return fileId;
    }
  }
  
  throw new Error("Failed to generate unique file ID after maximum attempts");
}
