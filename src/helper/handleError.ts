import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

// Add logger configuration after dotenv.config()
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    ]
  });

  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple()
    }));
  }
  
  // Helper function for error responses
  const handleError = (error: any, res: any) => {
    logger.error('Error occurred:', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Internal server error',
      ...((process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'localhost') && { details: error.message })
    });
  };

export default handleError;
  