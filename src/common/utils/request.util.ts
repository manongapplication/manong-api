export function generateRequestNumber(): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 chars
  return `REQ-${random}`;
}
