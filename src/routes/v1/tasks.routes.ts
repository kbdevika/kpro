import express from "express";
import prisma from "../../config/prisma.config";
import handleError from "../../helper/handleError";

const taskRouter = express.Router();

/**
 * @swagger
 * /task:
 *   post:
 *     summary: Create a new task
 *     description: Initiates a task in 'processing' status for the authenticated user.
 *     tags:
 *       - Task
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task_id:
 *                   type: string
 *                   example: "task_123"
 *       401:
 *         description: Authentication error.
 *       500:
 *         description: Internal server error.
 */
taskRouter.post('/', async (req: any, res: any) => {
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
  
  /**
 * @swagger
 * /{taskId}:
 *   get:
 *     summary: Get task status and details
 *     description: Retrieves the status and details of a task for the authenticated user.
 *     tags:
 *       - Task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to retrieve.
 *     responses:
 *       200:
 *         description: Task status and details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 output:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: string
 *                       example: "Task summary"
 *                     lineItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "lineItem_123"
 *                           description:
 *                             type: string
 *                             example: "Sample line item"
 *       401:
 *         description: Authentication error.
 *       404:
 *         description: Task not found.
 *       500:
 *         description: Internal server error.
 */
  taskRouter.get('/:taskId', async (req: any, res: any) => {
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