# AI Usage Report

> Tools used, key prompts, one case where AI was wrong, and the AI vs hand-written split — reported honestly per the assignment's instructions.

## Tools Used

- **Claude (Anthropic)** — used throughout the project as a pair-programming partner: scaffolding the FastAPI backend (models, schemas, services, API routes), designing the raw/clean/exceptions schema, writing the React frontend (Timeline, DayGroup, ExceptionRow, DetailPanel with recharts), debugging real errors as they came up (missing `__init__.py` files, import errors, a date-parsing crash), containerizing the app with Docker Compose, and drafting these documentation files.
- I ran every command myself in my own terminal and pasted the actual output back for verification at each step, rather than trusting generated code or generated fixes blindly.

## My 3–5 Most Important Prompts & What Came Back

**1.** *(Paraphrased from my initial request, which described the project goals and asked for a full plan)*: "Help me plan this project — I've already got the folder structure in place. Give me the best approach given the scoring priorities, a database schema, a backend/frontend file breakdown, and the commands to get started."
→ Got a full project plan: priorities matched to the assignment's scoring order, a concrete DB schema (raw/clean/exceptions tables), a backend folder-to-file mapping, a frontend component breakdown, and setup commands. This became the blueprint I followed for the rest of the build.

**2.** *(Pasted the actual pandas data-inspection output showing null `planned_units`, duplicate rows, and dirty `sku` casing/whitespace)*
→ Got a concrete cleaning strategy: normalize with `.strip().upper()`, quarantine null-plan rows instead of defaulting them to 0, and dedupe on the full row tuple — plus reasoning for why each choice was correct (e.g. defaulting nulls to 0 would create false 100%-deficit exceptions).

**3.** *(Pasted the `docker-compose up` failure: "unable to get image ... permission denied while trying to connect to the docker API")*
→ Got a diagnosis that my user account wasn't in the `docker` group and the daemon wasn't running, plus the exact `usermod`/`systemctl` commands to fix it — which then surfaced a second, deeper error.

**4.** *(Pasted `journalctl` output showing "error initializing buildkit: failed to find runc binary")*
→ Got the specific root cause (Fedora's Docker install was missing the `runc` binary dependency) and the fix (`sudo dnf install runc -y`), rather than a generic "restart Docker" suggestion.

**5.** *(Pasted the backend container's `PermissionError: [Errno 13] Permission denied: 'data/raw/production_plan.csv'`, after confirming host file permissions were already correct)*
→ Got a correct SELinux diagnosis — Fedora enforces SELinux by default and bind mounts need a context relabel — with the exact fix (`:z` suffix on the volume mount in `docker-compose.yml`). This was the least obvious bug in the whole project, since the host-side permissions looked completely fine.

## Where AI Was Wrong & How I Caught It

The first version of `cleaning_service.py` assumed **all** dates in `production_plan.csv` were in ISO format (`%Y-%m-%d`) and used a single `datetime.strptime(row.plan_date_raw, "%Y-%m-%d")` call with no fallback.

Running the cleaning script threw:
```
ValueError: time data '12/03/2017' does not match format '%Y-%m-%d'
```

I caught this because I actually ran the pipeline myself and pasted the real traceback back, rather than assuming the generated code worked. The fix added a `parse_date()` helper that tries multiple formats (`%Y-%m-%d`, `%d/%m/%Y`, `%m/%d/%Y`) and quarantines anything it still can't parse instead of crashing. I also flagged that `12/03/2017` is genuinely ambiguous (could be Dec 3 or Mar 12) — the AI's choice to try day/month first was a reasonable default, not a verified fact, so I noted it as an assumption in APPROACH.md rather than treating it as settled.

A second, similar case happened during Docker setup: the first `docker-compose.yml` had a plain bind mount (`./backend/data:/app/data`) with no SELinux relabel flag. This looked correct and matched standard Docker documentation, but failed specifically on my Fedora host with a `PermissionError` inside the container despite the host files being world-readable. I only found the real cause by pasting the exact error back and having it correctly identified as SELinux enforcement rather than a generic permissions bug — a plausible-looking fix (`chmod -R a+rX`) did not actually resolve it, which is itself evidence the first diagnosis needed verification before I trusted it.

## AI vs Hand-Written Split

- **AI-generated (used with minor edits):** ~70% — most model/schema/service/API/component boilerplate and the Docker/Compose configuration were drafted by AI and then run and verified by me at every step.
- **Heavily edited / hand-written / verified:** ~30% — actual debugging of real runtime errors (file paths, missing `__init__.py`, the date-format bug, the runc/SELinux Docker issues), verifying every API response and exception count against the raw data, cleaning up leftover duplicate files from earlier iterations, killing stray processes holding ports during Docker debugging, and git/GitHub setup were done by running real commands and reading real output myself, not just accepting generated code or generated fixes as correct.
