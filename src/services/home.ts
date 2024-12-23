import prisma from "../config/prisma.config";

/**
 * 
 * @param userId 
 * @returns 
 */
export async function getProfile(userId: string){
    const settings = await prisma.userSettingsModel.findFirst({
        where: { userId: userId, settingsKey: 'name' }
    });
    return settings
}