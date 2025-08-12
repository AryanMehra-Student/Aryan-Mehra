### Account Checker (for API testing)

This tool validates tokens or username/passwords against an API endpoint you specify. It is intended for authorized testing only.

- Modes: bearer tokens or basic auth
- Concurrency, optional rate limiting, and retries
- JSON success criteria via simple dot-path checks
- Input via CSV/JSON; output to CSV/JSON

#### Install

```bash
python -m pip install -r requirements.txt
```

#### Examples

- Tokens CSV (headers required):

```csv
# examples/tokens.csv
token
abc123...
xyz789...
```

- Users CSV:

```csv
# examples/users.csv
username,password
alice,secret1
bob,secret2
```

- Static headers JSON (optional):

```json
// examples/headers.json
{ "X-Client": "checker" }
```

#### Run (Bearer tokens)

```bash
python -m account_checker.cli \
  --mode bearer \
  --accounts examples/tokens.csv \
  --endpoint https://api.example.com/v1/me \
  --method GET \
  --headers examples/headers.json \
  --success-status 200 \
  --require id=12345 \
  --concurrency 25 \
  --rate-limit 10 \
  --timeout 10 \
  --retries 2 \
  --retry-backoff 0.5 \
  --output results.json
```

If you need to inject the token into a custom header, include `{token}` placeholder in `--headers`.

#### Run (Basic auth)

```bash
python -m account_checker.cli \
  --mode basic \
  --accounts examples/users.csv \
  --endpoint https://api.example.com/v1/me \
  --method GET \
  --success-status 200 \
  --output results.csv
```

#### JSON requirements

Use `--require key.path=value` to assert response JSON contains the exact value at the dot path. Value can be a JSON literal (e.g., `true`, `123`, `"text"`, `null`). Multiple `--require` flags can be provided.

#### Safety

- Only use with credentials/tokens you are authorized to test.
- Tokens are masked in output, and only short response excerpts are stored.