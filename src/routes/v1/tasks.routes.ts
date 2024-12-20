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
    const { taskId, cartId } = req.body 
    try {
      const task = await prisma.taskModel.create({
        data: {
          taskStatus: 'processing',
          userId: req.user.id,
          taskExternalId: taskId.toString(),
          cartId: cartId.toString()
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
      const task = await prisma.taskModel.findFirst({
        where: {
          id: req.params.taskId,
          userId: req.user.id
        }
      });
  
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
  
      if (task.taskStatus === 'success') {
        res.json({
          status: 'success',
          output: {
            cartId: task.cartId,
            taskId: task.taskExternalId,
            userId: task.userId,
            createdAt: task.taskCreatedDate
          }
        });
      } else {
        res.json({ status: task.taskStatus });
      }
    } catch (error) {
      handleError(error, res);
    }
  });

export default taskRouter;