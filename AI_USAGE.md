# AI Usage Report

> Tools used, key prompts, one case where AI was wrong, and the AI vs hand-written split — reported honestly per the assignment's instructions.

## Tools Used

- **Claude (Anthropic)** — used throughout the project as a pair-programming partner: scaffolding the FastAPI backend (models, schemas, services, API routes), designing the raw/clean/exceptions schema, writing the React frontend (Timeline, DayGroup, ExceptionRow, DetailPanel with recharts), debugging real errors as they came up (missing `__init__.py` files, import errors, a date-parsing crash), containerizing the app with Docker Compose, and drafting these documentation files.
- I ran every command myself in my own terminal and pasted the actual output back for verification at each step, rather than trusting generated code or generated fixes blindly.

## My 3–5 Most Important Prompts & What Came Back

**1.** *(Paraphrased and structured from my initial planning request)*:
> "I'm building a Mini Exception Inbox for an internship assignment, scored in this priority order: data handling, backend completeness, frontend, AI usage quality, communication. I already have the folder structure in place. Give me: (1) a database schema separating raw and cleaned data, (2) a backend file-by-file breakdown mapped to my existing folders, (3) a frontend component breakdown, and (4) the exact commands to scaffold and run it. Optimize the plan for the stated scoring priorities, not just general best practice."

→ Got a full project plan matched to the scoring order: a concrete raw/clean/exceptions schema, a backend folder-to-file mapping, a frontend component breakdown, and setup commands. This became the blueprint for the rest of the build.

**2.** *(Structured around pasted pandas inspection output)*:
> "Here's the actual output of inspecting both CSVs with pandas before loading them: [pasted null counts, duplicate counts, and sample dirty SKU values]. Give me a cleaning strategy for each issue — normalization approach, whether to drop or quarantine bad rows, and the reasoning for each choice, not just the code."

→ Got a concrete strategy: normalize with `.strip().upper()`, quarantine null-plan rows instead of defaulting them to 0, dedupe on the full row tuple — with reasoning for each (e.g. defaulting nulls to 0 would manufacture false 100%-deficit exceptions).

**3.** *(Structured around a pasted Docker Compose failure)*:
> "Running `docker-compose up` on Fedora fails with: [pasted: 'unable to get image ... permission denied while trying to connect to the docker API']. Diagnose the root cause — don't just suggest restarting Docker — and give me the exact commands to fix it."

→ Got a diagnosis that my user account wasn't in the `docker` group and the daemon wasn't running, plus the exact `usermod`/`systemctl` commands — which then surfaced a second, deeper error.

**4.** *(Structured around pasted journalctl output)*:
> "The Docker daemon still won't start after the group fix. Here's the full `journalctl -xeu docker.service` output: [pasted, showing 'error initializing buildkit: failed to find runc binary']. What's the actual root cause, and what's the minimal fix?"

→ Got the specific root cause — Fedora's Docker install was missing the `runc` binary dependency — and the fix (`sudo dnf install runc -y`), rather than a generic troubleshooting checklist.

**5.** *(Structured around a persistent, previously-misdiagnosed error)*:
> "The backend container still throws `PermissionError: [Errno 13] Permission denied: 'data/raw/production_plan.csv'` even after I confirmed host file permissions are correct (644, world-readable) and applied `chmod -R a+rX`. That fix didn't work, so the diagnosis must be wrong — what else could cause a container to fail reading a correctly-permissioned bind mount on Fedora?"

→ Got the correct SELinux diagnosis — Fedora enforces SELinux by default, and bind mounts need their context relabeled — with the exact fix (the `:z` suffix on the volume mount). This was the least obvious bug in the project, and the prompt explicitly flagging that the first fix *didn't* work was what got a different, correct diagnosis instead of a repeat of the same one.

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
