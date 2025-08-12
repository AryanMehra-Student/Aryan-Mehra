from __future__ import annotations

from pathlib import Path
from typing import List, Sequence
import fnmatch

from ..core import Check, Issue


class FileSizeCheck(Check):
    name = "file_size"

    def __init__(self, options=None):
        super().__init__(options)
        self.max_bytes: int = int(self.options.get("max_bytes", 1_000_000))
        self.globs: Sequence[str] = self.options.get("globs", ["**/*"])  # type: ignore[assignment]

    def should_consider_file(self, file_path: Path) -> bool:
        return any(file_path.match(pat) for pat in self.globs)

    def run_on_file(self, file_path: Path) -> List[Issue]:
        issues: List[Issue] = []
        try:
            size = file_path.stat().st_size
        except Exception:
            return issues

        if size > self.max_bytes:
            issues.append(
                Issue(
                    file=str(file_path),
                    message=f"File size {size} bytes exceeds max of {self.max_bytes} bytes",
                    code="FSZ001",
                    severity="WARN",
                )
            )
        return issues