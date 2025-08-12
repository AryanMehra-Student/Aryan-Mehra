from __future__ import annotations

import argparse
from pathlib import Path
from typing import Dict, Optional

from .core import Runner


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="checker", description="Run project checks.")
    parser.add_argument("path", nargs="?", default=".", help="File or directory to check")
    parser.add_argument("--config", dest="config", help="Path to JSON config file")
    parser.add_argument(
        "--format",
        dest="output_format",
        choices=["pretty", "json"],
        default="pretty",
        help="Output format",
    )

    # Common overrides for built-in checks
    parser.add_argument("--max-line-length", type=int, dest="max_line_length", help="Max line length")
    parser.add_argument("--max-bytes", type=int, dest="max_bytes", help="Max file size in bytes")

    return parser.parse_args()


def _build_overrides(args: argparse.Namespace) -> Dict[str, object]:
    overrides: Dict[str, object] = {}
    checks: Dict[str, object] = {}

    if args.max_line_length is not None:
        checks.setdefault("line_length", {})  # type: ignore[index]
        checks["line_length"]["max"] = args.max_line_length  # type: ignore[index]
    if args.max_bytes is not None:
        checks.setdefault("file_size", {})  # type: ignore[index]
        checks["file_size"]["max_bytes"] = args.max_bytes  # type: ignore[index]

    if checks:
        overrides["checks"] = checks
    return overrides


def main() -> int:
    args = _parse_args()
    base_path = Path(args.path).resolve()
    config = Runner.load_config_file(Path(args.config)) if args.config else None
    overrides = _build_overrides(args)

    runner = Runner(base_path=base_path, config=config, cli_overrides=overrides)
    issues, summary = runner.run()
    Runner.print_report(issues, summary, output_format=args.output_format)
    return Runner.exit_code_from_issues(issues)


if __name__ == "__main__":
    raise SystemExit(main())