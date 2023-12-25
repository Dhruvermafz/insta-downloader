import { BadRequest, TimeoutException } from "@/lib/exceptions";
import { getTimedFilename } from "@/utils";

export const getIGVideoFileName = () => {
    getTimedFilename("ig-downloader", "mp4");
}

export const handleScraperError = (error: any) => {
    console.log("Scrapper error:", error.message);
    if(error.message.includes("Status Code 404")) {
        throw new BadRequest("This post is private or does not exist", 404);
    } else if(error instanceof TimeoutException) {
        throw new TimeoutException();
    }
}