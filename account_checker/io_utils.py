import csv
import json
import os
from typing import Any, Dict, List


def load_accounts_from_path(path: str) -> List[Dict[str, Any]]:
    if not os.path.exists(path):
        raise SystemExit(f"Accounts file not found: {path}")
    lower = path.lower()
    if lower.endswith(".csv"):
        return _load_accounts_from_csv(path)
    if lower.endswith(".json"):
        return _load_accounts_from_json(path)
    raise SystemExit("Accounts file must be .csv or .json")


def _load_accounts_from_csv(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = [dict(row) for row in reader]
        return rows


def _load_accounts_from_json(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
        if isinstance(data, list):
            return [dict(item) for item in data]
        raise SystemExit("JSON accounts file must contain an array of objects")


def write_results_to_path(results: List[Dict[str, Any]], path: str) -> None:
    lower = path.lower()
    if lower.endswith(".json"):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        return

    if lower.endswith(".csv"):
        _write_results_to_csv(results, path)
        return

    # Default to JSON if extension unknown
    with open(path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)


def _write_results_to_csv(results: List[Dict[str, Any]], path: str) -> None:
    # Collect all keys to create header
    field_names = set()
    for r in results:
        field_names.update(r.keys())
    ordered_fields = ["ok", "identifier", "status_code", "error", "body_snippet"]
    for k in sorted(field_names):
        if k not in ordered_fields:
            ordered_fields.append(k)

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=ordered_fields)
        writer.writeheader()
        for r in results:
            writer.writerow(r)