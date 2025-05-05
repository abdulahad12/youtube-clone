export const asyncHandler = (fn) => {
  return (...args) =>
    Promise.resolve(fn(...args)).catch((error) => {
      console.log(error);
    });
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

// export default asyncHandler;
