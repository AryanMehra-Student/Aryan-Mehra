from __future__ import annotations

import json
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple
import fnmatch


@dataclass
class Issue:
    file: str
    message: str
    severity: str = "ERROR"
    code: str = "GEN001"
    line: Optional[int] = None
    column: Optional[int] = None

    def to_dict(self) -> Dict[str, object]:
        return asdict(self)


class Check:
    name: str = "check"

    def __init__(self, options: Optional[Dict[str, object]] = None) -> None:
        self.options = options or {}

    def should_consider_file(self, file_path: Path) -> bool:
        return True

    def run_on_file(self, file_path: Path) -> List[Issue]:
        raise NotImplementedError


class Runner:
    def __init__(
        self,
        base_path: Path,
        config: Optional[Dict[str, object]] = None,
        cli_overrides: Optional[Dict[str, object]] = None,
    ) -> None:
        self.base_path = base_path
        self.config = self._merge_config(self._default_config(), config or {}, cli_overrides or {})
        self.checks = self._instantiate_checks(self.config.get("checks", {}))

    def _default_config(self) -> Dict[str, object]:
        return {
            "include": ["**"],
            "exclude": ["**/.git/**", "**/.venv/**", "**/venv/**", "**/__pycache__/**"],
            "checks": {
                "line_length": {"max": 120, "globs": ["**/*.py", "**/*.txt", "**/*.md"]},
                "json_syntax": {},
                "file_size": {"max_bytes": 1_000_000, "globs": ["**/*"]},
            },
        }

    def _merge_config(
        self,
        default: Dict[str, object],
        user: Dict[str, object],
        overrides: Dict[str, object],
    ) -> Dict[str, object]:
        def deep_merge(a: Dict[str, object], b: Dict[str, object]) -> Dict[str, object]:
            result: Dict[str, object] = dict(a)
            for key, value in b.items():
                if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                    result[key] = deep_merge(result[key], value)  # type: ignore[index]
                else:
                    result[key] = value
            return result

        return deep_merge(deep_merge(default, user), overrides)

    def _instantiate_checks(self, checks_cfg: Dict[str, object]):
        from .checks.file_size import FileSizeCheck
        from .checks.json_syntax import JsonSyntaxCheck
        from .checks.line_length import LineLengthCheck

        registry = {
            "file_size": FileSizeCheck,
            "json_syntax": JsonSyntaxCheck,
            "line_length": LineLengthCheck,
        }
        checks = []
        for name, options in checks_cfg.items():
            cls = registry.get(name)
            if cls is None:
                continue
            checks.append(cls(options if isinstance(options, dict) else {}))
        return checks

    def _iter_target_files(self) -> Iterable[Path]:
        include_patterns: Sequence[str] = self.config.get("include", [])  # type: ignore[assignment]
        exclude_patterns: Sequence[str] = self.config.get("exclude", [])  # type: ignore[assignment]

        if self.base_path.is_file():
            candidates = [self.base_path]
        else:
            candidates = [p for p in self.base_path.rglob("*") if p.is_file()]

        for path in candidates:
            rel = path.relative_to(self.base_path if self.base_path.is_dir() else self.base_path.parent)
            rel_str = str(rel)

            if include_patterns and not any(rel.match(pat) for pat in include_patterns):
                continue
            if exclude_patterns and any(rel.match(pat) for pat in exclude_patterns):
                continue
            yield path

    def run(self) -> Tuple[List[Issue], Dict[str, int]]:
        issues: List[Issue] = []
        for path in self._iter_target_files():
            for check in self.checks:
                try:
                    if not check.should_consider_file(path):
                        continue
                    issues.extend(check.run_on_file(path))
                except Exception as exc:
                    issues.append(
                        Issue(
                            file=str(path),
                            message=f"Check '{check.__class__.__name__}' failed with exception: {exc}",
                            severity="ERROR",
                            code="CHKERR",
                        )
                    )
        summary = {
            "files": len({i.file for i in issues}),
            "issues": len(issues),
            "errors": sum(1 for i in issues if i.severity.upper() == "ERROR"),
            "warnings": sum(1 for i in issues if i.severity.upper() == "WARN"),
        }
        return issues, summary

    @staticmethod
    def load_config_file(config_path: Optional[Path]) -> Optional[Dict[str, object]]:
        if not config_path:
            return None
        with config_path.open("r", encoding="utf-8") as f:
            return json.load(f)

    @staticmethod
    def print_report(issues: List[Issue], summary: Dict[str, int], output_format: str = "pretty") -> None:
        output_format = output_format.lower()
        if output_format == "json":
            payload = {
                "issues": [i.to_dict() for i in issues],
                "summary": summary,
            }
            print(json.dumps(payload, indent=2))
            return

        if not issues:
            print("No issues found.")
            return

        for issue in issues:
            loc = f":{issue.line}" if issue.line is not None else ""
            print(f"{issue.severity} {issue.code} {issue.file}{loc} - {issue.message}")
        print(
            f"Summary: {summary['issues']} issues | {summary['errors']} errors | {summary['warnings']} warnings"
        )

    @staticmethod
    def exit_code_from_issues(issues: List[Issue]) -> int:
        return 1 if any(i.severity.upper() == "ERROR" for i in issues) else 0