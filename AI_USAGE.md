# AI Usage Report

> Tools used, key prompts, one case where AI was wrong, and the AI vs hand-written split — reported honestly per the assignment's instructions.

## Tools Used

- **Claude (Anthropic)** — used throughout the project as a pair-programming partner: scaffolding the FastAPI backend (models, schemas, services, API routes), designing the raw/clean/exceptions schema, writing the React frontend (Timeline, DayGroup, ExceptionRow, DetailPanel with recharts), debugging real errors as they came up (missing `__init__.py` files, import errors, a date-parsing crash), and drafting these documentation files.
- I ran every command myself in my own terminal and pasted the actual output back for verification at each step, rather than trusting generated code blindly.

## My 3–5 Most Important Prompts (Verbatim) & What Came Back

**1.** *"this I will made can you give me as best Idea you can give me I already made the structure as if any thing remove you tell me I can remove and add just tell me commands as best idea you can give that give cause this is my internship assignment and I want to select in that give me full idea in text and tell me after wardds commands"*
→ Got a full project plan: priorities matched to the assignment's scoring order, a concrete DB schema (raw/clean/exceptions tables), a backend folder-to-file mapping, a frontend component breakdown, and setup commands. This became the blueprint I followed for the rest of the build.

**2.** *"Remove existing files and continue"* (in the context of a Vite ESLint/Oxlint prompt)
→ Got a recommendation to pick ESLint over Oxlint, with reasoning (established/standard tooling, not being judged on lint choice) plus the exact npm commands to continue scaffolding.

**3.** (Pasted terminal output showing `FileNotFoundError: data/raw/production_plan.csv` and `No module named app.services.ingestion_service`)
→ Got two separate diagnoses: the CSVs weren't in the path being searched, and the services module needed `__init__.py` files to be importable as a package. Both turned out to be correct — confirmed once I found the CSVs (they were sitting at the project root, not inside `backend/`) and created the missing `__init__.py` files.

**4.** (Pasted the actual pandas inspection output showing null `planned_units`, duplicate rows, and dirty `sku` casing/whitespace)
→ Got a concrete cleaning strategy: normalize with `.strip().upper()`, quarantine null-plan rows instead of defaulting them to 0, and dedupe on the full row tuple — plus the reasoning for why each choice was correct (e.g. defaulting nulls to 0 would create false 100%-deficit exceptions).

**5.** *"vivekbadgujar@fedora:~/destila-exception-inbox$ curl http://localhost:8000/exceptions | head -c 2000 ... [pasted API output]"*
→ Got confirmation the sort order and deficit math were correct, plus a specific set of follow-up `curl` commands to verify the severity filter, product filter, detail endpoint's 7-day trend, and PATCH persistence — before moving on to frontend work.

## Where AI Was Wrong & How I Caught It

The first version of `cleaning_service.py` assumed **all** dates in `production_plan.csv` were in ISO format (`%Y-%m-%d`) and used a single `datetime.strptime(row.plan_date_raw, "%Y-%m-%d")` call with no fallback.

Running the cleaning script threw:
```
ValueError: time data '12/03/2017' does not match format '%Y-%m-%d'
```

I caught this because I actually ran the pipeline myself and pasted the real traceback back, rather than assuming the generated code worked. The fix added a `parse_date()` helper that tries multiple formats (`%Y-%m-%d`, `%d/%m/%Y`, `%m/%d/%Y`) and quarantines anything it still can't parse instead of crashing. I also flagged that `12/03/2017` is genuinely ambiguous (could be Dec 3 or Mar 12) — the AI's choice to try day/month first was a reasonable default, not a verified fact, so I noted it as an assumption in APPROACH.md rather than treating it as settled.

## AI vs Hand-Written Split

- **AI-generated (used with minor edits):** ~75% — most model/schema/service/API/component boilerplate was drafted by AI and then run and verified by me at every step.
- **Heavily edited / hand-written / verified:** ~25% — actual debugging of real runtime errors (file paths, missing `__init__.py`, the date-format bug), verifying every API response and exception count against the raw data, cleaning up leftover duplicate files from earlier iterations, and git/GitHub setup were done by running real commands and reading real output myself, not just accepting generated code as correct.
