from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import RedirectResponse
import os

IS_PRODUCTION = os.getenv("e") == "production"


class DomainRedirectMiddleware(BaseHTTPMiddleware):
    """Redirect fastbuy.io.vn → www.fastbuy.io.vn"""

    async def dispatch(self, request, call_next):
        if not IS_PRODUCTION:
            return await call_next(request)

        host = request.headers.get("host", "").lower()

        if host == "fastbuy.io.vn":
            new_url = f"https://www.{host}{request.url.path}"
            if request.url.query:
                new_url += f"?{request.url.query}"
            return RedirectResponse(url=new_url, status_code=301)

        return await call_next(request)