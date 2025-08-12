from __future__ import annotations

from pathlib import Path
from typing import List, Sequence
import fnmatch

from ..core import Check, Issue


class LineLengthCheck(Check):
    name = "line_length"

    def __init__(self, options=None):
        super().__init__(options)
        self.max_length: int = int(self.options.get("max", 120))
        self.globs: Sequence[str] = self.options.get("globs", ["**/*.py", "**/*.txt", "**/*.md"])  # type: ignore[assignment]

    def should_consider_file(self, file_path: Path) -> bool:
        return any(file_path.match(pat) for pat in self.globs)

    def run_on_file(self, file_path: Path) -> List[Issue]:
        issues: List[Issue] = []
        try:
            text = file_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            return issues

        for idx, line in enumerate(text.splitlines(), start=1):
            if len(line) > self.max_length:
                issues.append(
                    Issue(
                        file=str(file_path),
                        line=idx,
                        message=f"Line exceeds max length of {self.max_length} characters (len={len(line)})",
                        code="LL001",
                        severity="ERROR",
                    )
                )
        return issues