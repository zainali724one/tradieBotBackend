const ErrorMiddleware = (err, req, res, next) => {
  err.message = err.message || "Enternal server error";
  err.statusCode = err.statusCode || 500;

  console.log("middleware working", err.message);
  return res.status(err.statusCode).send({
    success: false,
    message: err.message,
  });
};

module.exports = { ErrorMiddleware };
