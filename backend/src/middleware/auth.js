import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.error('[Auth Middleware] Токен не предоставлен');
      return res.status(401).json({ 
        success: false,
        message: 'Token not provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Устанавливаем объект user для использования в контроллерах
    req.user = { id: decoded.id };
    req.userId = decoded.id; // Оставляем для обратной совместимости
    
    console.log(`[Auth Middleware] Пользователь аутентифицирован: ${decoded.id}`);
    next();
  } catch (error) {
    console.error('[Auth Middleware] Ошибка проверки токена:', error.message);
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }
};
