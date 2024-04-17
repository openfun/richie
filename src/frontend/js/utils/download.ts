import { handle } from './errors/handle';

/**
 * browserDownloadFromBlob handle direct download of a file api response.
 *
 * @param downloadFunction, an api promise that return a File
 * @param newWindow, does it open in a new window or not
 * @returns boolean, true for success
 */
export const browserDownloadFromBlob = async (
  downloadFunction: () => Promise<File>,
  newWindow: boolean = false,
) => {
  try {
    const file = await downloadFunction();

    // eslint-disable-next-line compat/compat
    const url = URL.createObjectURL(file);

    if (newWindow) {
      window.open(url);
      return true;
    }

    const $link = document.createElement('a');
    $link.href = url;
    $link.download = file.name;

    const revokeObject = () => {
      // eslint-disable-next-line compat/compat
      URL.revokeObjectURL(url);
      window.removeEventListener('blur', revokeObject);
    };

    window.addEventListener('blur', revokeObject);
    $link.click();
    return true;
  } catch (error) {
    handle(error);
  }

  return false;
};
