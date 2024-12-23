import prisma from "../config/prisma.config"

/**
 * 
 * @param userId 
 */
export async function createNotification(userId: string) {
    try {
        if(userId){
            await prisma.notificationModel.create({
                data:{
                    notificationMessage: `Your cart is ready`,
                    userId: userId
                }
            })
        }
    } catch(error: any){
        throw new Error(`Unable to create Notification! ${error.message}`)
    }
}