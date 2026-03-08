const success = (res, payload = {}, message = "OK", statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      ...payload,
    });
  };
  
  const failure = (res, message = "Something went wrong", statusCode = 500, extra = {}) => {
    return res.status(statusCode).json({
      success: false,
      message,
      ...extra,
    });
  };
  
  module.exports = {
    success,
    failure,
  };
  