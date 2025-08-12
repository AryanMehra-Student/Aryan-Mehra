# Aryan-Mehra
Hi, I am Aryan Mehra I am doing my Education At Amity University

---

## Checker

A minimal, extensible Python checker with a simple CLI and built-in checks.

### Install deps

```bash
pip install -r requirements.txt
```

### Run

```bash
python -m checker.cli . --format pretty
python -m checker.cli . --format json
python -m checker.cli . --max-line-length 100
python -m checker.cli some/file.json --format pretty
```

### Config (optional)
Create `checker.config.json`:

```json
{
  "include": ["**/*"],
  "exclude": ["**/.git/**", "**/__pycache__/**"],
  "checks": {
    "line_length": {"max": 120, "globs": ["**/*.py", "**/*.md", "**/*.txt"]},
    "json_syntax": {"globs": ["**/*.json"]},
    "file_size": {"max_bytes": 1000000, "globs": ["**/*"]}
  }
}
```

Run with:

```bash
python -m checker.cli . --config checker.config.json
```
