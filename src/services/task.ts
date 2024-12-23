import prisma from "../config/prisma.config";

/**
 * 
 * @param taskId 
 * @param cartId 
 * @param userId 
 */
export async function createTask(taskId: string, cartId: string, userId: string) {
    try {
        if(taskId && cartId && userId){
            await prisma.taskModel.create({
                data:{
                    taskExternalId: taskId,
                    taskStatus: 'success',
                    cartId: cartId,
                    userId: userId
                }
            })
        }
    } catch(error: any){
        throw new Error(`Unable to create Task! ${error.message}`)
    }
}