# Icon Generator

Generates missing icon PNGs using `mflux-generate` and writes them into
`src/assets/icons/...`.

## Requirements

- Python 3.13+
- Dependencies from `pyproject.toml`
- `mflux-generate` available either:
  - on `PATH`, or
  - via `MFLUX_GENERATE_PATH`

## Setup

From `scripts/icon-generator/`:

```bash
uv sync
```

## Usage

Run from repository root:

```bash
python scripts/icon-generator/generate.py
```

If `mflux-generate` is not on `PATH`, set an explicit path:

```bash
MFLUX_GENERATE_PATH="/absolute/path/to/mflux-generate" python scripts/icon-generator/generate.py
```

The script skips icons that already exist.
