export const sharedRepositoryFolderId = "1llsQaXWvMrYBGyem4ohDyAJeGrwyfih0";
export const sharedRepositoryFolderUrl = `https://drive.google.com/drive/folders/${sharedRepositoryFolderId}`;

/** Converts a sharing link into an iframe-safe Drive URL without opening a new tab. */
export function googleDriveEmbedUrl(fileUrl: string) {
  const folder = fileUrl.match(/drive\.google\.com\/drive\/folders\/([^/?#]+)/);
  if (folder) return `https://drive.google.com/embeddedfolderview?id=${folder[1]}#grid`;

  const file = fileUrl.match(/drive\.google\.com\/file\/d\/([^/?#]+)/) || fileUrl.match(/[?&]id=([^&#]+)/);
  if (file) return `https://drive.google.com/file/d/${file[1]}/preview`;

  // Handles common Drive sharing URLs ending in /view?usp=sharing.
  return fileUrl.replace(/\/view(?:\?[^#]*)?$/, "/preview");
}
