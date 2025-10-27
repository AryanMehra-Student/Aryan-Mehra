import os
import sys
import argparse
from typing import List, Optional, Tuple, Dict

# Optional Tkinter import for GUI file selection
try:
    import tkinter as tk
    from tkinter import filedialog
    TK_AVAILABLE = True
except Exception:
    tk = None  # type: ignore
    filedialog = None  # type: ignore
    TK_AVAILABLE = False


def print_status(message: str) -> None:
    print(message, flush=True)


def open_file_dialog() -> Optional[str]:
    if not TK_AVAILABLE:
        return None

    try:
        root = tk.Tk()
        root.withdraw()
        path = filedialog.askopenfilename(
            title="Select card file (number|month|year|cvv)",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
            initialdir=os.getcwd(),
        )
        return path if path else None
    except Exception:
        return None
    finally:
        try:
            root.destroy()  # type: ignore[name-defined]
        except Exception:
            pass


def normalize_year(year_str: str) -> str:
    year_str = year_str.strip()
    if len(year_str) == 2:
        # Assume 2000s for 2-digit years
        return f"20{year_str}"
    return year_str


def normalize_month(month_str: str) -> str:
    month_str = month_str.strip()
    if month_str.isdigit():
        month_int = int(month_str)
        if 1 <= month_int <= 12:
            return f"{month_int:02d}"
    return month_str


def digits_only(card_number: str) -> str:
    return "".join(ch for ch in card_number if ch.isdigit())


def format_spaced(card_number_digits: str) -> str:
    groups: List[str] = []
    for i in range(0, len(card_number_digits), 4):
        groups.append(card_number_digits[i : i + 4])
    return " ".join(groups)


def parse_card_line(line: str, line_number: int) -> Optional[Dict[str, str]]:
    raw = line.strip()
    if not raw or raw.startswith("#"):
        return None

    parts = raw.split("|")
    if len(parts) != 4:
        print_status(f"Skipping line {line_number}: expected 4 parts, got {len(parts)}")
        return None

    raw_number, raw_month, raw_year, raw_cvv = [p.strip() for p in parts]

    # Accept numbers with spaces; also keep a digits-only variant
    number_digits = digits_only(raw_number)
    if not number_digits.isdigit() or len(number_digits) < 13 or len(number_digits) > 19:
        print_status(f"Skipping line {line_number}: invalid card number")
        return None

    month = normalize_month(raw_month)
    year = normalize_year(raw_year)
    cvv = raw_cvv

    if not month.isdigit() or not (1 <= int(month) <= 12):
        print_status(f"Skipping line {line_number}: invalid month")
        return None

    if not year.isdigit() or len(year) != 4:
        print_status(f"Skipping line {line_number}: invalid year")
        return None

    if not cvv.isdigit() or len(cvv) not in (3, 4):
        print_status(f"Skipping line {line_number}: invalid CVV")
        return None

    return {
        "number_spaced": format_spaced(number_digits),
        "number_digits": number_digits,
        "month": month,
        "year": year,
        "cvv": cvv,
    }


def parse_card_file(path: str, encoding: str = "utf-8") -> List[Dict[str, str]]:
    cards: List[Dict[str, str]] = []
    with open(path, "r", encoding=encoding) as f:
        for idx, line in enumerate(f, 1):
            parsed = parse_card_line(line, idx)
            if parsed:
                cards.append(parsed)
    return cards


def main() -> int:
    parser = argparse.ArgumentParser(description="Card file picker and parser (number|month|year|cvv)")
    parser.add_argument("--file", dest="file_path", default=None, help="Path to card file (txt)")
    parser.add_argument("--encoding", default="utf-8", help="File encoding (default: utf-8)")
    args = parser.parse_args()

    file_path: Optional[str] = args.file_path
    if not file_path:
        print_status("Opening file picker (if available)...")
        file_path = open_file_dialog()

    if not file_path:
        print_status("No file selected. Provide --file <path> if GUI picker is unavailable.")
        return 1

    if not os.path.exists(file_path):
        print_status(f"File does not exist: {file_path}")
        return 1

    print_status(f"Reading: {os.path.basename(file_path)}")
    cards = parse_card_file(file_path, encoding=args.encoding)
    print_status(f"Loaded {len(cards)} valid entries")

    # Preview (masking number for safety)
    for i, c in enumerate(cards[:5], 1):
        masked = f"**** **** **** {c['number_digits'][-4:]}"
        print_status(f"[{i}] {masked} | {c['month']}/{c['year']} | CVV: ***")

    # Placeholder: this is where processing each card would occur in test-mode automation
    # for c in cards:
    #     process_card_in_test_mode(c)

    return 0


if __name__ == "__main__":
    sys.exit(main())

