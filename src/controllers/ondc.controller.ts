import { Controller, Get, Route, Request, Tags } from "tsoa";

@Route("ondc")
@Tags("ONDC")
export class ONDCController extends Controller {
  /**
   * Retrieves home page data, including welcome text, banners, and carousels.
   * @returns Home page details
   */
  @Get("/")
  public async search(
    @Request() req: any
): Promise<{

        }> {
       
    return {  }
    }
}