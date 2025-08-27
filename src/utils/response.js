export const successResponse = (res, message, data = null, code = 200) => {
  return res.status(code).json({
    code,
    message,
    data,
  });
};

export const errorResponse = (res, message, code = 400, data = null) => {
  return res.status(code).json({
    code,
    message,
    data,
  });
};
