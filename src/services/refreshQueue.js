export const createRefreshQueue = (refreshOperation, onFailure = () => {}) => {
  let inFlightRefresh = null;

  return () => {
    if (!inFlightRefresh) {
      inFlightRefresh = Promise.resolve()
        .then(refreshOperation)
        .catch(error => {
          onFailure(error);
          throw error;
        })
        .finally(() => {
          inFlightRefresh = null;
        });
    }

    return inFlightRefresh;
  };
};
