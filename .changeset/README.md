# Changesets

This directory is managed by [Changesets](https://github.com/changesets/changesets).

When you make a change that should be released, run:

```
pnpm changeset
```

This will prompt you to select the packages and bump type (major/minor/patch), then create a markdown file in this directory describing the change.

When changeset files are merged to `main`, the CI release workflow will open a "Version Packages" PR. Merging that PR will publish the updated packages to npm.
