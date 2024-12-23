import { Controller, Get, Post, Delete, Route, Tags, Body, Path, Response, Security, Request } from "tsoa";
import prisma from "../config/prisma.config";

interface Notification {
  id: string;
  notificationMessage: string;
  notificationMediaUrl: string | null;
  userId: string;
  notificationCreatedDate: Date;
}

interface CreateNotificationRequest {
  message: string;
  media_url?: string;
  userId: string;
}

interface CreateNotificationResponse {
  message: string;
  notification: Notification;
}

@Route("notifications")
@Tags("Notifications")
@Security("jwt")
export class NotificationController extends Controller {
  /**
   * Fetch all notifications for the logged-in user.
   * @returns A list of notifications.
   */
  @Get("/")
  @Response(404, "No notifications found")
  public async getNotifications(@Request() req: any): Promise<{ notifications: Notification[] }> {
    const notifications = await prisma.notificationModel.findMany({
      where: { userId: req.user.id },
      orderBy: { notificationCreatedDate: "desc" },
    });

    if (notifications.length === 0) {
      this.setStatus(404);
      throw new Error("No notifications found");
    }

    return { notifications };
  }

  /**
   * Create a new notification.
   * @param body The request body containing the notification details.
   * @returns A success message with the created notification.
   */
  @Post("/")
  @Response<CreateNotificationResponse>(201, "Notification added successfully")
  @Response(400, "Missing or invalid inputs")
  public async createNotification(
    @Body() body: CreateNotificationRequest
  ): Promise<CreateNotificationResponse> {
    const { message, media_url, userId } = body;

    if (!message || !userId) {
      this.setStatus(400);
      throw new Error("Missing or invalid inputs");
    }

    const newNotification = await prisma.notificationModel.create({
      data: {
        notificationMessage: message,
        notificationMediaUrl: media_url || "",
        userId,
      },
    });

    return {
      message: "Notification added successfully",
      notification: newNotification,
    };
  }

  /**
   * Delete a notification by ID.
   * @param id The ID of the notification to delete.
   * @returns A success message with the deleted notification details.
   */
  @Delete("/{id}")
  @Response(200, "Notification deleted successfully")
  @Response(404, "Notification not found")
  public async deleteNotification(@Path() id: string): Promise<{ message: string; notification: Notification }> {
    try {
      const deletedNotification = await prisma.notificationModel.delete({
        where: { id },
      });

      return {
        message: "Notification deleted successfully",
        notification: deletedNotification,
      };
    } catch (error) {
      this.setStatus(404);
      throw new Error("Notification not found");
    }
  }
}