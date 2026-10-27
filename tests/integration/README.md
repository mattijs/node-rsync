# Local rsync integration tests

Run separately from the unit tests:

```sh
npm run test:integration
```

Requires Node.js 14.14+ and a working `rsync` on `PATH`. Missing `rsync` fails
the suite rather than silently skipping it. `npm test` remains unchanged and
does not run these integration tests. No CI configuration is changed.

The two Mocha tests use `rsync.js` and real child processes, without mocks:

- Leave `executeInShell` unset, assert it defaults to `false`, and verify the
  child's `spawnfile` is `rsync` with the raw argument vector.
- Set `executeInShell(true)` and verify the child's `spawnfile` is `/bin/sh`
  with `-c` and the assembled command string (`cmd.exe /s /c` on Windows).

Both tests copy `fixtures/source-data/` into a unique temporary directory and
check exit code zero, matching directory entries, and byte-for-byte contents.
Mocha hooks create and remove the temporary output for each test, including on
failure. Each test has a 10-second timeout; cleanup stops any unfinished child
before removing its output. Fixtures remain untouched.

All transfers are local filesystem copies: no remote hosts, SSH, network
transfers, or injection commands. Shell mode uses only trusted local paths;
do not use it with untrusted input.
