from __future__ import annotations

from pathlib import Path
import json

from checker.core import Runner


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def test_line_length(tmp_path: Path):
    file_path = tmp_path / "sample.py"
    long_line = "x" * 150
    write_text(file_path, f"print('hello')\n{long_line}\n")

    config = {
        "checks": {
            "line_length": {"max": 120, "globs": ["**/*.py"]},
            "json_syntax": {},
            "file_size": {"max_bytes": 10_000, "globs": ["**/*.py"]},
        }
    }
    runner = Runner(base_path=tmp_path, config=config)
    issues, summary = runner.run()

    assert any(i.code == "LL001" for i in issues)
    assert summary["issues"] >= 1


def test_json_syntax(tmp_path: Path):
    good = tmp_path / "good.json"
    bad = tmp_path / "bad.json"
    write_text(good, json.dumps({"a": 1}))
    write_text(bad, "{\n  \"a\": 1,\n  bad\n}\n")

    config = {
        "checks": {
            "json_syntax": {"globs": ["**/*.json"]},
            "file_size": {"max_bytes": 10_000, "globs": ["**/*.json"]},
        }
    }
    runner = Runner(base_path=tmp_path, config=config)
    issues, _ = runner.run()

    assert any(i.code == "JSN001" and Path(i.file).name == "bad.json" for i in issues)
    assert not any(Path(i.file).name == "good.json" and i.code.startswith("JSN") for i in issues)


def test_file_size(tmp_path: Path):
    small = tmp_path / "small.bin"
    big = tmp_path / "big.bin"
    small.write_bytes(b"0" * 10)
    big.write_bytes(b"0" * 1024)

    config = {
        "checks": {
            "file_size": {"max_bytes": 100, "globs": ["**/*.bin"]},
        }
    }
    runner = Runner(base_path=tmp_path, config=config)
    issues, _ = runner.run()

    names = {Path(i.file).name for i in issues}
    assert "big.bin" in names
    assert "small.bin" not in names