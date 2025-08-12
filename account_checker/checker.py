import asyncio
import time
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional

import httpx


class AccountMode(str, Enum):
    BEARER = "bearer"
    BASIC = "basic"


@dataclass
class AccountCheckerConfig:
    mode: AccountMode
    endpoint: str
    method: str
    static_headers: Dict[str, str]
    success_status_codes: List[int]
    json_requirements: Dict[str, Any]
    timeout_seconds: float
    max_retries: int
    initial_backoff_seconds: float
    max_concurrency: int
    rate_limit_per_second: float
    fail_fast: bool = False


def get_value_at_path(obj: Any, path: str) -> Any:
    current = obj
    for part in path.split("."):
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return None
    return current


def mask_secret(value: Optional[str], visible: int = 4) -> str:
    if not value:
        return ""
    if len(value) <= visible:
        return "*" * len(value)
    return value[:visible] + "…" + "*" * (len(value) - visible)


class RateLimiter:
    def __init__(self, rate_per_second: float) -> None:
        self.rate = rate_per_second
        self.timestamps: List[float] = []
        self.lock = asyncio.Lock()

    async def wait_for_slot(self) -> None:
        if self.rate <= 0:
            return
        async with self.lock:
            now = time.monotonic()
            window_start = now - 1.0
            # Drop old timestamps
            self.timestamps = [t for t in self.timestamps if t >= window_start]
            if len(self.timestamps) >= self.rate:
                # Sleep until earliest timestamp is outside window
                sleep_time = self.timestamps[0] - window_start
                await asyncio.sleep(max(0.0, sleep_time))
            # Record this request
            self.timestamps.append(time.monotonic())


async def perform_request(
    client: httpx.AsyncClient,
    config: AccountCheckerConfig,
    account: Dict[str, Any],
) -> Dict[str, Any]:
    headers = dict(config.static_headers)
    auth: Optional[httpx.Auth] = None

    identifier: str = ""

    if config.mode == AccountMode.BEARER:
        token = str(account.get("token", ""))
        identifier = mask_secret(token)
        if "{token}" in "".join(headers.values()):
            # Format headers with provided token
            headers = {k: v.replace("{token}", token) for k, v in headers.items()}
        else:
            headers.setdefault("Authorization", f"Bearer {token}")
    elif config.mode == AccountMode.BASIC:
        username = str(account.get("username", ""))
        password = str(account.get("password", ""))
        identifier = username if username else mask_secret(password)
        auth = httpx.BasicAuth(username, password)
    else:
        raise ValueError("Unsupported mode")

    attempt = 0
    backoff = config.initial_backoff_seconds

    last_error: Optional[str] = None
    last_status: Optional[int] = None
    last_body_snippet: Optional[str] = None

    while True:
        try:
            response = await client.request(
                config.method,
                config.endpoint,
                headers=headers,
                auth=auth,
                timeout=config.timeout_seconds,
            )
            last_status = response.status_code
            text_snippet = response.text[:200] if response.text else ""
            last_body_snippet = text_snippet

            # Evaluate success
            ok = response.status_code in config.success_status_codes
            if ok and config.json_requirements:
                try:
                    data = response.json()
                except Exception:
                    ok = False
                else:
                    for path, expected in config.json_requirements.items():
                        actual = get_value_at_path(data, path)
                        if actual != expected:
                            ok = False
                            break

            return {
                "ok": ok,
                "identifier": identifier,
                "status_code": last_status,
                "body_snippet": last_body_snippet,
            }
        except httpx.RequestError as exc:
            last_error = str(exc)
        except Exception as exc:  # Unexpected
            last_error = f"Unexpected: {exc}"

        # Determine if retry
        attempt += 1
        should_retry = attempt <= config.max_retries
        if not should_retry:
            return {
                "ok": False,
                "identifier": identifier,
                "status_code": last_status,
                "error": last_error,
                "body_snippet": last_body_snippet,
            }
        await asyncio.sleep(backoff)
        backoff *= 2


async def worker(
    name: str,
    client: httpx.AsyncClient,
    config: AccountCheckerConfig,
    accounts: List[Dict[str, Any]],
    in_queue: "asyncio.Queue[int]",
    out_list: List[Dict[str, Any]],
    rate_limiter: RateLimiter,
    stop_event: asyncio.Event,
) -> None:
    while not stop_event.is_set():
        try:
            idx = await asyncio.wait_for(in_queue.get(), timeout=0.2)
        except asyncio.TimeoutError:
            if in_queue.empty():
                return
            continue

        # Respect rate limit
        await rate_limiter.wait_for_slot()

        result = await perform_request(client, config, accounts[idx])
        out_list[idx] = result

        if config.fail_fast and not result.get("ok", False):
            stop_event.set()

        in_queue.task_done()


async def run_account_checks(
    accounts: List[Dict[str, Any]],
    config: AccountCheckerConfig,
) -> List[Dict[str, Any]]:
    if not accounts:
        return []

    connector_limits = httpx.Limits(max_keepalive_connections=config.max_concurrency, max_connections=config.max_concurrency)

    async with httpx.AsyncClient(limits=connector_limits) as client:
        in_queue: asyncio.Queue[int] = asyncio.Queue()
        for i in range(len(accounts)):
            in_queue.put_nowait(i)

        results: List[Optional[Dict[str, Any]]] = [None] * len(accounts)
        stop_event = asyncio.Event()

        rate_limiter = RateLimiter(config.rate_limit_per_second)

        workers = [
            asyncio.create_task(
                worker(
                    name=f"w{i}",
                    client=client,
                    config=config,
                    accounts=accounts,
                    in_queue=in_queue,
                    out_list=results,  # type: ignore
                    rate_limiter=rate_limiter,
                    stop_event=stop_event,
                )
            )
            for i in range(min(config.max_concurrency, len(accounts)))
        ]

        await asyncio.gather(*workers)

    # Fill any Nones (should not happen) with failure objects
    finalized: List[Dict[str, Any]] = []
    for i, item in enumerate(results):
        if item is None:
            finalized.append({"ok": False, "identifier": "", "error": "No result"})
        else:
            finalized.append(item)

    return finalized