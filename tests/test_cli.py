from __future__ import annotations

import json
import subprocess
import sys
import os
from pathlib import Path


def run_cli(args, cwd: Path) -> subprocess.CompletedProcess:
    env = dict(**os.environ)
    env["PYTHONPATH"] = str(Path(__file__).resolve().parents[1])
    return subprocess.run(
        [sys.executable, "-m", "checker.cli", *args],
        cwd=str(cwd),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=False,
        env=env,
    )


def test_cli_json_output(tmp_path: Path):
    # Create a file with a long line to ensure there is at least one issue
    sample = tmp_path / "file.txt"
    sample.write_text("x" * 140, encoding="utf-8")

    proc = run_cli([str(tmp_path), "--format", "json", "--max-line-length", "100"], cwd=tmp_path)
    assert proc.returncode == 1
    payload = json.loads(proc.stdout)
    assert "issues" in payload and isinstance(payload["issues"], list)
    assert any(i["code"] == "LL001" for i in payload["issues"]) or any(i["code"] == "FSZ001" for i in payload["issues"])