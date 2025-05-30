export const createSafeDetector = (detectorName, detectFunction) => {
  return async (...args) => {
    try {
      console.log(`[${detectorName}] Starting detection...`);
      const result = await detectFunction(...args);
      if (!Array.isArray(result)) {
        console.warn(`[${detectorName}] Invalid result, returning []`);
        return [];
      }
      return result;
    } catch (error) {
      console.error(`[${detectorName}] Failed:`, error);
      return [];
    }
  };
};
