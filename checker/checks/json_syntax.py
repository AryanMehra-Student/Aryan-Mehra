from __future__ import annotations

import json
from pathlib import Path
from typing import List, Sequence
import fnmatch

from ..core import Check, Issue


class JsonSyntaxCheck(Check):
    name = "json_syntax"

    def __init__(self, options=None):
        super().__init__(options)
        self.globs: Sequence[str] = self.options.get("globs", ["**/*.json"])  # type: ignore[assignment]

    def should_consider_file(self, file_path: Path) -> bool:
        return any(file_path.match(pat) for pat in self.globs)

    def run_on_file(self, file_path: Path) -> List[Issue]:
        issues: List[Issue] = []
        if not file_path.is_file():
            return issues
        try:
            with file_path.open("r", encoding="utf-8") as f:
                json.load(f)
        except json.JSONDecodeError as exc:
            issues.append(
                Issue(
                    file=str(file_path),
                    line=exc.lineno,
                    column=exc.colno,
                    message=f"Invalid JSON: {exc.msg}",
                    code="JSN001",
                    severity="ERROR",
                )
            )
        except Exception as exc:
            issues.append(
                Issue(
                    file=str(file_path),
                    message=f"Failed to parse JSON: {exc}",
                    code="JSNERR",
                    severity="ERROR",
                )
            )
        return issues