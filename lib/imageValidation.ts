// Magic-byte signatures — the client-supplied Content-Type/extension are
// trivially spoofable, so the accepted list is enforced against the
// file's actual bytes, not the claimed mimetype. Shared by every upload
// endpoint (admin media/pieces, and the public checkout receipt upload).
export const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // Vercel serverless functions cap request bodies around 4.5MB

export const IMAGE_SIGNATURES = [
  { ext: '.jpg', mime: 'image/jpeg', check: (b: Buffer) => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF },
  { ext: '.png', mime: 'image/png', check: (b: Buffer) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 },
  { ext: '.gif', mime: 'image/gif', check: (b: Buffer) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  { ext: '.webp', mime: 'image/webp', check: (b: Buffer) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 }
];

export function detectImageSignature(buf: Buffer) {
  return IMAGE_SIGNATURES.find((s) => s.check(buf));
}
