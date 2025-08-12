import argparse
import asyncio
import json
import os
from typing import Any, Dict, List, Optional

from .checker import AccountCheckerConfig, AccountMode, run_account_checks
from .io_utils import load_accounts_from_path, write_results_to_path


def parse_headers(headers_arg: Optional[str]) -> Dict[str, str]:
    if not headers_arg:
        return {}
    # If a file path
    if os.path.exists(headers_arg):
        with open(headers_arg, "r", encoding="utf-8") as f:
            return json.load(f)
    # Try parsing as JSON string
    try:
        parsed = json.loads(headers_arg)
        if isinstance(parsed, dict):
            return {str(k): str(v) for k, v in parsed.items()}
    except json.JSONDecodeError:
        pass
    raise SystemExit("--headers must be a path to a JSON file or a JSON object string")


def parse_requirements(require_args: List[str]) -> Dict[str, Any]:
    requirements: Dict[str, Any] = {}
    for item in require_args or []:
        if "=" not in item:
            raise SystemExit("--require entries must be in the form key.path=value")
        key, value = item.split("=", 1)
        # Try to parse value as JSON literal; fallback to string
        try:
            parsed_value = json.loads(value)
        except json.JSONDecodeError:
            parsed_value = value
        requirements[key.strip()] = parsed_value
    return requirements


def parse_status_list(status_str: str) -> List[int]:
    items = [s.strip() for s in status_str.split(",") if s.strip()]
    try:
        return [int(s) for s in items]
    except ValueError:
        raise SystemExit("--success-status must be a comma-separated list of integers")


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Account/Token checker for API testing (safe, for authorized use only)",
    )

    parser.add_argument("--mode", choices=["bearer", "basic"], default="bearer", help="Authentication mode to use")
    parser.add_argument("--accounts", required=True, help="Path to accounts file (CSV or JSON)")

    parser.add_argument("--endpoint", required=True, help="Endpoint URL to test against")
    parser.add_argument("--method", default="GET", choices=["GET", "POST", "PUT", "PATCH", "DELETE"], help="HTTP method")
    parser.add_argument("--headers", help="Static headers as JSON string or path to JSON file; may include {token}")

    parser.add_argument("--success-status", default="200", help="Comma-separated list of acceptable HTTP status codes (e.g., 200,204)")
    parser.add_argument(
        "--require",
        action="append",
        default=[],
        help="JSON requirement in the form key.path=value; can be specified multiple times",
    )

    parser.add_argument("--timeout", type=float, default=15.0, help="Per-request timeout in seconds")
    parser.add_argument("--retries", type=int, default=1, help="Number of retries for transient errors")
    parser.add_argument("--retry-backoff", type=float, default=0.5, help="Initial backoff seconds (exponential)")

    parser.add_argument("--concurrency", type=int, default=20, help="Max concurrent requests")
    parser.add_argument("--rate-limit", type=float, default=0.0, help="Max requests per second (0 = unlimited)")

    parser.add_argument("--output", default="results.json", help="Path to write results (.json or .csv)")
    parser.add_argument("--fail-fast", action="store_true", help="Stop on first failure")

    return parser


def main() -> None:
    parser = build_arg_parser()
    args = parser.parse_args()

    mode = AccountMode.BEARER if args.mode == "bearer" else AccountMode.BASIC
    headers = parse_headers(args.headers)
    requirements = parse_requirements(args.require)
    success_codes = parse_status_list(args.success_status)

    accounts = load_accounts_from_path(args.accounts)

    config = AccountCheckerConfig(
        mode=mode,
        endpoint=args.endpoint,
        method=args.method,
        static_headers=headers,
        success_status_codes=success_codes,
        json_requirements=requirements,
        timeout_seconds=args.timeout,
        max_retries=args.retries,
        initial_backoff_seconds=args.retry_backoff,
        max_concurrency=args.concurrency,
        rate_limit_per_second=args.rate_limit,
        fail_fast=args.fail_fast,
    )

    results = asyncio.run(run_account_checks(accounts, config))
    write_results_to_path(results, args.output)

    total = len(results)
    ok = sum(1 for r in results if r["ok"]) if results else 0
    print(f"Completed {total} checks. OK={ok}, FAIL={total-ok}. Results written to {args.output}")


if __name__ == "__main__":
    main()