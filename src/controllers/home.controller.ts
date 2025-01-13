import { getProfile } from "../services/home";
import { Controller, Get, Route, Request, Tags, Security } from "tsoa";

@Route("home")
@Tags("Home")
@Security("jwt")
export class HomeController extends Controller {
    /**
     * Retrieves home page data, including welcome text, banners, and carousels.
     * @returns Home page details
     */
    @Get("/")
    public async getHome(@Request() req: any): Promise<{
        welcomeText: string;
        welcomeSubText: string;
        banners: { data: { id: string; image_url: string; deeplink: string }[]; title: string };
        carousels: { data: { id: string; image_url: string; deeplink: string }[]; title: string };
    }> {
        const userId = req.user.id;
        const profile = await getProfile(userId);
        const welcomeText = `Hi, ${profile?.settingsValue || 'trendsetter'}`
        const welcomeSubText = 'Here are some things that you can ask!'

        const banners = {
            data: [
                {
                    id: '1',
                    image_url: "https://firebasestorage.googleapis.com/v0/b/kiranapro-ios.firebasestorage.app/o/Banner%201.jpg?alt=media&token=92ddda72-9686-454c-a7e7-43454f1fc5bb",
                    deeplink: ''
                },
                {
                    id: '2',
                    image_url: "https://firebasestorage.googleapis.com/v0/b/kiranapro-ios.firebasestorage.app/o/Banner%202.jpg?alt=media&token=ff9cf8bf-3ca5-4d91-91af-1aef5d267c49",
                    deeplink: ''
                },
                {
                    id: '3',
                    image_url: "https://firebasestorage.googleapis.com/v0/b/kiranapro-ios.firebasestorage.app/o/Banner%203.jpg?alt=media&token=832dd67d-042a-40f4-95a0-c0fcb54170f3",
                    deeplink: ''
                }
            ],
            title: 'Sample'
        }

        const carousels = {
            data: [
                {
                    id: '1',
                    image_url: "https://firebasestorage.googleapis.com/v0/b/kiranapro-ios.firebasestorage.app/o/1.png?alt=media&token=f5a68d36-4a4c-4bd0-988c-8f85abdc3c09",
                    deeplink: ''
                },
                {
                    id: '2',
                    image_url: "https://firebasestorage.googleapis.com/v0/b/kiranapro-ios.firebasestorage.app/o/2.png?alt=media&token=5f71826e-eb66-4281-8626-e2fe32b9e0fe",
                    deeplink: ''
                },
                {
                    id: '3',
                    image_url: "https://firebasestorage.googleapis.com/v0/b/kiranapro-ios.firebasestorage.app/o/3.png?alt=media&token=1a4699c5-ec0d-4faa-8a5c-4bf013008357",
                    deeplink: ''
                },
            ],
            title: 'To create your cart, try saying,'
        }

        return { welcomeText, welcomeSubText, banners, carousels }
    }
}