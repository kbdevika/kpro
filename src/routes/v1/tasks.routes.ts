import express from "express";
import prisma from "../../config/prisma.config";
import handleError from "../../helper/handleError";

const taskRouter = express.Router();

// Task Routes
taskRouter.post('/agent', async (req: any, res: any) => {
    try {
      const task = await prisma.task.create({
        data: {
          status: 'processing',
          userId: req.user.id,
          summary: ''
        }
      });
      res.json({ task_id: task.id });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  taskRouter.get('/task/:taskId', async (req: any, res: any) => {
    try {
      const task = await prisma.task.findFirst({
        where: {
          id: req.params.taskId,
          userId: req.user.id
        },
        include: {
          lineItems: true
        }
      });
  
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
  
      if (task.status === 'success') {
        res.json({
          status: 'success',
          output: {
            summary: task.summary,
            lineItems: task.lineItems
          }
        });
      } else {
        res.json({ status: task.status });
      }
    } catch (error) {
      handleError(error, res);
    }
  });

export default taskRouter;