import { Body, Controller, Get, Path, Post, Request, Response, Route, Tags } from "tsoa";
import prisma from "../config/prisma.config";

interface CreateTaskRequest {
  taskId: string;
  cartId: string;
}

interface TaskResponse {
  status: string;
  output?: {
    cartId: string;
    taskId: string;
    userId: string;
    createdAt: Date;
  };
}

@Route("tasks")
@Tags("Task")
export class TaskController extends Controller {
  /**
   * Create a new task for a user.
   * @param req Express request object
   * @param body Task creation data
   * @returns Task ID of the created task
   */
  @Post("/")
  @Response(400, "Invalid input")
  public async createTask(
    @Request() req: any,
    @Body() body: CreateTaskRequest
  ): Promise<{ task_id: string }> {
    const { taskId, cartId } = body;

    try {
      const task = await prisma.taskModel.create({
        data: {
          taskStatus: "processing",
          userId: req.user.id,
          taskExternalId: taskId.toString(),
          cartId: cartId.toString(),
        },
      });

      return { task_id: task.id };
    } catch (error) {
      this.setStatus(500);
      throw new Error("Unable to create task");
    }
  }

  /**
   * Fetch the status or details of a task based on task ID.
   * @param req Express request object
   * @param taskId Task ID to retrieve
   * @returns Task status or details
   */
  @Get("/{taskId}")
  @Response(404, "Task not found")
  public async getTask(
    @Request() req: any,
    @Path() taskId: string
  ): Promise<TaskResponse> {
    try {
      const task = await prisma.taskModel.findFirst({
        where: {
          id: taskId,
          userId: req.user.id,
        },
      });

      if (!task) {
        this.setStatus(404);
        throw new Error("Task not found");
      }

      if (task.taskStatus === "success") {
        return {
          status: "success",
          output: {
            cartId: task.cartId,
            taskId: task.taskExternalId,
            userId: task.userId,
            createdAt: task.taskCreatedDate,
          },
        };
      } else {
        return { status: task.taskStatus };
      }
    } catch (error) {
      this.setStatus(500);
      throw new Error("Unable to fetch task");
    }
  }
}
