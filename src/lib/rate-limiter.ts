import {Ratelimit} from "@upstash/ratelimit"
import {Redis} from "@upstash/redis"
import { getClientIp } from "@/utils"
import { upstashToken, upstashUrl, enableUpstash, upstashBanDuration, upstashBanEnabled, maxRequests, requestsWindow } from "@/configs/upstash"
import { NextRequest } from "next/server"

const isValidUpstash = () => {
    if(!upstashUrl) {
        console.error("UPSTASH_URL is missing from your environment variables");
    }

    if(!upstashToken) {
        console.error("UPSTASH_TOKEN is missing from your environment variables.");
    }

    return upstashUrl !== "" && upstashToken !== "";
}

export const redisClient = new Redis({
    url: upstashUrl,
    token: upstashToken,
})

export const ratelimit = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(maxRequests, requestsWindow)
})

export const isRatelimited = async (request: NextRequest) => {
    if(!enableUpstash) return false;

    // check if upstash variables are set correctly
    const validUpstash = isValidUpstash();
    if(!validUpstash) return false;

    try {
        const identifier = getClientIp(request);
        if(!identifier) return false;
        const result = await ratelimit.limit(identifier);
        if(result.success) return false;

        // ban user if ratelimit exceeded
        if(upstashBanEnabled) {
            await redisClient.setex(
                `ban:${identifier}`,
                upstashBanDuration,
                "banned"
            )
        }
        return true;
    } catch(error: any) {
        console.error(error.message)
        return false;
    }
}