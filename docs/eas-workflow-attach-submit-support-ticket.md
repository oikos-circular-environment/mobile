# EAS Workflow job never starts after successful upstream job — internal error

Support ticket text filed with Expo about `attach_and_submit_ios` never running in
`.eas/workflows/ios-review-submission.yml`, even after its dependency job succeeds.

**Subject: EAS Workflow job never starts after successful upstream job — "Failed to process workflow run: internal error during execution"**

**Project:** `oikos-circular-environment/oikos`
**Workflow file:** `.eas/workflows/ios-review-submission.yml`
**Affected run:** `01a058dc-70d7-725e-9f0f-e24d3c77dfde` (Aug 31, 2026, 1:27 PM, triggered by `app_store_connect.build_upload` webhook, state `complete`)

## What I'm trying to do

I have a two-job EAS Workflow that fully automates iOS App Store releases, triggered automatically when a build upload finishes processing on App Store Connect:

```yaml
on:
  app_store_connect:
    build_upload:
      states:
        - complete

jobs:
  push_ios_metadata:
    name: Push App Store metadata
    type: custom
    steps:
      - uses: eas/checkout
      - run: npm ci
      - name: Push metadata
        run: node store/scripts/push-ios-metadata.mjs

  attach_and_submit_ios:
    name: Attach build and submit for review
    type: custom
    needs: [push_ios_metadata]
    env:
      IOS_ASC_BUILD_ID: ${{ (app_store_connect.build_upload.build && app_store_connect.build_upload.build.id) || '' }}
      IOS_BUILD_NUMBER: ${{ app_store_connect.build_upload.cf_bundle_version || inputs.build_number || '' }}
    steps:
      - uses: eas/checkout
      - run: npm ci
      - name: Attach build and submit for review
        run: node store/scripts/submit-ios-for-review.mjs
```

`push_ios_metadata` runs `eas metadata:push` (via a wrapper script). `attach_and_submit_ios` calls the App Store Connect API directly (via `@oikos-circular-environment/apple-connect-api`, our own OpenAPI-generated client) to attach the processed build to the App Store Version and submit it for review, following Apple's documented 3-step `reviewSubmissions` flow (create submission → add item → PATCH `submitted: true`).

Android is fully automated end-to-end with EAS Workflows already. iOS is the only platform where I still have to attach the build and submit for review manually through the App Store Connect web UI, because this second job never completes.

## What's happening

In run `01a058dc-70d7-725e-9f0f-e24d3c77dfde`:

- `push_ios_metadata` completed successfully (green checkmark, 1m 7s). Its log shows the metadata push finished cleanly (screenshot warnings aside — that was a separate, unrelated issue on our end that we've since fixed).
- `attach_and_submit_ios` **never started** — no steps ran, it shows as a grayed-out/blocked node in the workflow graph, and it doesn't even appear in the "Jobs" list for the run (only 1 job is listed, even though the workflow file defines 2 jobs plus a diagnostic third one added afterward).
- The overall run status is "Errored", with this top-level message (not attributed to any specific job or step):

  ```
  Failed to process workflow run
  This job failed due to an internal error during execution.
  ```

- Total run duration: 1m 18s.

## Why I don't think this is a dependency-skip or a script bug

I compared this against an older run of the same workflow (`01a000d7-c954-7ad0-8b15-76caa59321d1`, Aug 14) where `push_ios_metadata` genuinely failed. In that case, `attach_and_submit_ios` was correctly skipped with a clear, specific message: **"Attach build and submit for review — Push App Store metadata failed."** That's the expected `needs:` dependency-skip behavior, and it's clear about why the job didn't run.

The Aug 31 run is different: the upstream job succeeded, yet the downstream job still didn't run, and instead of a dependency-skip message, the whole run errors out with the generic internal-error message quoted above. This looks like a workflow-orchestration failure on the EAS platform side, not something in our job configuration or scripts.

## What we've ruled out on our end

- `eas workflow:validate .eas/workflows/ios-review-submission.yml` passes with no errors — the YAML is syntactically valid.
- The `env` expressions on `attach_and_submit_ios` already guard against the `app_store_connect.build_upload.build` field being absent (it's documented as optional even when `build_upload.state` is `complete`), so a null/undefined field shouldn't throw during interpolation: `${{ (app_store_connect.build_upload.build && app_store_connect.build_upload.build.id) || '' }}`.
- The screenshot-not-found warnings in `push_ios_metadata`'s log were a separate bug in our own `store.config.js` (hardcoded filenames not matching what was actually on disk) — already fixed locally, unrelated to `attach_and_submit_ios` never starting.
- We added a third, independent diagnostic job (`debug_asc_context`, no `needs`) that dumps the same `app_store_connect.build_upload.*` fields to stdout, to try to isolate whether the crash comes from the `app_store_connect.*` expression itself or specifically from the `needs` + `env` combination on `attach_and_submit_ios`. We haven't been able to trigger a fresh `build_upload: complete` webhook yet to see its output.

## A working theory: build-processing delay

One thing we haven't ruled out: the trigger fires on `app_store_connect.build_upload.states: [complete]`, which (per the documented schema) only means the *upload* finished — it doesn't necessarily mean the build has finished Apple's own processing and reached `processingState: VALID`, which is the only state in which a build can actually be attached to an App Store Version. If `attach_and_submit_ios` (or whatever schedules it) tries to resolve/attach the build immediately off that trigger and the build isn't attachable yet, that race could plausibly surface as an opaque internal error rather than a clean "build not ready" message. We don't have direct evidence for this from the dashboard, but it would explain why the failure looks like an orchestration problem rather than a script bug — happy to hear if this matches something known on Expo's side.

## What I'm asking

1. Is there any additional internal log Expo can pull for run `01a058dc-70d7-725e-9f0f-e24d3c77dfde` that explains what "internal error during execution" actually was, specifically for the `attach_and_submit_ios` job (or whatever process was supposed to create/schedule it)?
2. Is there a known issue with `app_store_connect.build_upload` context fields (particularly `.build.id`, which is documented as optional) causing a job to fail to be scheduled at all, as opposed to failing with a normal step error?
3. Is `needs: [job_using_app_store_connect_context]` combined with `env` expressions referencing `app_store_connect.build_upload.*` a known-fragile pattern? Is there a recommended alternative (e.g., resolving these values in a step-level `env` inside the job instead of job-level `env`) that avoids this failure mode?
4. Could the `build_upload: complete` state fire before the build is actually in a `processingState` that allows it to be attached to an App Store Version? If so, is there a more reliable trigger/state to wait on, or a recommended backoff/retry pattern for this specific race?

Happy to share the full workflow file, both run links, and our diagnostic job's output once we get a fresh trigger, if that helps investigate.
