import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export const shareFile = async (fileUri: string, title = 'Share PDF') => {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(fileUri, { dialogTitle: title });
};
