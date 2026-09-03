/**
 * 错误处理中间件
 * 统一处理API错误
 */

const errorHandler = (err, req, res, next) => {
  console.error('API错误:', err);
  
  // 默认错误响应
  let statusCode = 500;
  let message = '服务器错误';
  
  // 根据错误类型设置状态码和消息
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = '输入验证错误';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = '未授权访问';
  } else if (err.message) {
    message = err.message;
  }
  
  // 返回错误响应
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;