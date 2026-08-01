"""
Small dependency-free async retry helper with exponential backoff.
Used to wrap outbound calls to the Groq API so transient network errors
or rate limits don't immediately fail the request.
"""
import asyncio
import functools
import logging
from typing import Awaitable, Callable, Tuple, Type, TypeVar

T = TypeVar("T")

logger = logging.getLogger(__name__)


def async_retry(
    max_attempts: int = 3,
    base_delay_seconds: float = 1.0,
    max_delay_seconds: float = 8.0,
    retry_exceptions: Tuple[Type[BaseException], ...] = (Exception,),
):
    """
    Decorator that retries an async function with exponential backoff.

    Args:
        max_attempts: total number of attempts (including the first).
        base_delay_seconds: initial delay before the first retry.
        max_delay_seconds: cap on the backoff delay.
        retry_exceptions: exception types that trigger a retry.
    """

    def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            attempt = 0
            delay = base_delay_seconds
            last_exception: BaseException | None = None

            while attempt < max_attempts:
                try:
                    return await func(*args, **kwargs)
                except retry_exceptions as exc:  # noqa: BLE001
                    last_exception = exc
                    attempt += 1
                    if attempt >= max_attempts:
                        logger.error(
                            "Attempt %s/%s failed for %s, giving up: %s",
                            attempt, max_attempts, func.__name__, exc,
                        )
                        break
                    logger.warning(
                        "Attempt %s/%s failed for %s: %s. Retrying in %.1fs",
                        attempt, max_attempts, func.__name__, exc, delay,
                    )
                    await asyncio.sleep(delay)
                    delay = min(delay * 2, max_delay_seconds)

            assert last_exception is not None
            raise last_exception

        return wrapper

    return decorator
