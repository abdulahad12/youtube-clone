const asyncHandler = (asyncHandler) => {
  console.log(asyncHandler, "asyncHandlerasyncHandlerasyncHandler");

  return (req, res, next) =>
    Promise.resolve(asyncHandler(req, res, next)).catch((error) => next(error));
};

// const asyncHandler = (fun) => {
//   return async (req, res, next) => {
//     try {
//       return await fun(req, res, next);
//     } catch (error) {
//       res.status(error.code || 500).json({ message: error.message });
//     }
//   };
// };

export default asyncHandler;
