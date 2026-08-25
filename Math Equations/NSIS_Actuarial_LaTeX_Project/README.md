# NSIS Actuarial Calculation Explanation — LaTeX Project

This project explains the mathematical functions implemented in the uploaded NSIS website's actuarial scenario calculator. It covers the four modeled policies:

1. Employment Injury Insurance
2. Maternity Benefit Insurance
3. Unemployment Insurance
4. Old-Age Social Insurance

The explanation is based only on the uploaded website files, especially `index.html` and `script.js`.

The formulas and explanatory text have been checked against the current
calculator implementation. In particular, EIS, unemployment, and old-age
contributions use total covered payroll, while maternity contributions and the
maternity required-rate denominator use covered female-worker payroll.

## Open in VS Code

1. Open this folder in VS Code.
2. Install the **LaTeX Workshop** extension if it is not already installed.
3. Open `main.tex`.
4. Use **LaTeX Workshop: Build LaTeX project** from the Command Palette, or press the extension's build shortcut.
5. Open the generated `main.pdf` in the VS Code PDF viewer.

The included `.vscode/settings.json` uses `latexmk` with PDFLaTeX.

The source is intentionally compatible with a basic TeX Live/TinyTeX
installation. It does not require optional packages such as `tcolorbox`,
`titlesec`, `lastpage`, `mathtools`, `enumitem`, `microtype`, or `fancyhdr`.

## Build from the terminal

```bash
latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex
```

or:

```bash
make
```

## Clean auxiliary files

```bash
latexmk -c
```

or:

```bash
make clean
```

## Project structure

- `main.tex` — document entry point
- `sections/01_scope.tex` — model purpose and notation
- `sections/02_common_framework.tex` — common projection equations
- `sections/03_four_policies.tex` — policy descriptions and branch-specific formulas
- `sections/04_outputs_and_limits.tex` — output meanings, limitations, compact formula summary
- `sections/05_source_mapping.tex` — mapping to the uploaded website files
- `main.pdf` — compiled preview
