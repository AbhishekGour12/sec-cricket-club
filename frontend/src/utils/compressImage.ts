import * as ImageManipulator from 'expo-image-manipulator';

const MAX_EDGE = 1600;
const COMPRESS_QUALITY = 0.7;

/**
 * Compresses and optionally downsizes an image before upload.
 * Returns a local file URI suitable for FormData.
 */
export async function compressImageForUpload(
  uri: string,
  options?: { maxEdge?: number; quality?: number },
): Promise<{ uri: string; mimeType: string; fileName: string }> {
  const maxEdge = options?.maxEdge ?? MAX_EDGE;
  const quality = options?.quality ?? COMPRESS_QUALITY;

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxEdge } }],
    {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return {
    uri: result.uri,
    mimeType: 'image/jpeg',
    fileName: `flyer-${Date.now()}.jpg`,
  };
}
