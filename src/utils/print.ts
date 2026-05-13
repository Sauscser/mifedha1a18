// This file provides a wrapper for printing using expo-print
import * as Print from 'expo-print';

export const printAsync = async (options) => {
  // options: { html, ... }
  return await Print.printAsync(options);
};

export const printToFileAsync = async (options) => {
  // options: { html, ... }
  return await Print.printToFileAsync(options);
};
