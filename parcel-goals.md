## Goal

Parcel picks up `.babelrc`, `babel.config.json` and `package.json` babel configurations in monorepos in a way that...

1. ...mirrors (as closely as possible) the way that the latest `babel-cli` works, so that users can apply their existing expectations to parcel with as few "gotchas" as possible.
2. ...does not add unnecessary, babel-specific configuration flags to parcel that are only used to tell it where to look for babel configuration (i.e. unlike the `babel-cli`, parcel (ideally) shouldn't burden the user with specifying things like [`rootMode`](https://babeljs.io/docs/en/config-files#root-babelconfigjson-file)).

## Monorepo scenarios

The table below outlines current `babel` and `parcel2` behavior in different scenarios, along with a proposal about how the behavior should change.

| Config at root      | Config in subproject | `babel-cli` result (running from root) | `babel-cli` result (running from subproject with no special options) | Current `parcel` result (as of `2.0.0-nightly.99`) | Proposed changes to `parcel` result\*\* | Notes                                                                                                                                                                                                                                        |
| ------------------- | -------------------- | -------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| nothing             | `.babelrc`\*         | config ignored                         | config respected                                                     | config **ignored**                                 | config **respected**                    | Babel documentation [recommends](https://babeljs.io/docs/en/config-files#subpackage-babelrcjson-files) setting [`babelrcRoots`](https://babeljs.io/docs/en/options#babelrcroots) to enable detection when running `babel-cli` from the root. |
| nothing             | `babel.config.json`  | config ignored                         | config respected                                                     | config **ignored**                                 | config **respected**                    |
| `.babelrc` \*       | nothing              | config ignored                         | config ignored                                                       | config ignored                                     | -                                       | This is not expected to work, because babel will stop looking for `.babelrc` files as it travels up the directory and discovers the sub-package's `package.json` file, but no `.babelrc` file near it.                                       |
| `.babelrc` \*       | `.babelrc` \*        | TBD                                    | TBD                                                                  | TBD                                                | TBD                                     |
| `.babelrc` \*       | `babel.config.json`  | TBD                                    | TBD                                                                  | TBD                                                | TBD                                     |
| `babel.config.json` | nothing              | config respected                       | config ignored                                                       | config respected                                   | -                                       | Babel documentation [recommends](https://babeljs.io/docs/en/config-files#root-babelconfigjson-file) setting `--rootMode upward` to enable detection when running `babel-cli` from the subproject.                                            |
| `babel.config.json` | `.babelrc`\*         | root respected, subproject ignored     | root ignored, subproject respected                                   | both root and subproject respected                 | TBD                                     | Babel documentation [recommends](https://babeljs.io/docs/en/config-files#subpackage-babelrcjson-files) setting [`babelrcRoots`](https://babeljs.io/docs/en/options#babelrcroots) or `--rootMode upward` to enable detection                  |
| `babel.config.json` | `babel.config.json`  | TBD                                    | TBD                                                                  | TBD                                                | TBD                                     |

\* or `package.json` with a `babel` property (i.e. a file-relative configuration).

\*\* Ideally, we could deliver the same (predictable) result whether `parcel` was run at the project root or in a sub-package.

## Background Information

Below are key snippets from the [babel documentation](https://babeljs.io/docs/en/config-files) to help inform the desired behavior and implementation.

### Configuration File Types

> https://babeljs.io/docs/en/config-files#configuration-file-types
>
> Babel has two parallel config file formats, which can be used together, or independently.
>
> - Project-wide configuration
>   - `babel.config.json` files, with the different extensions
> - File-relative configuration
>   - `.babelrc.json` files, with the different extensions
>   - `package.json` files with a "babel" key

### Gotchas with "file-relative" configuration

> https://babeljs.io/docs/en/config-files#file-relative-configuration
>
> Babel loads `.babelrc.json` files, or an equivalent one using the supported extensions, by searching up the directory structure starting from the "filename" being compiled (limited by the caveats below). This can be powerful because it allows you to create independent configurations for subsections of a package. File-relative configurations are also merged over top of project-wide config values, making them potentially useful for specific overrides, though that can also be accomplished through "overrides".
>
> There are a few edge cases to consider when using a file-relative config:
>
> - Searching will stop once a directory containing a package.json is found, so a relative config only applies within a single package.
> - The "filename" being compiled must be inside of "babelrcRoots" packages, or else searching will be skipped entirely.
>
> These caveats mean that:
>
> - `.babelrc.json` files only apply to files within their own package
> - `.babelrc.json` files in packages that aren't Babel's 'root' are ignored unless you opt in with "babelrcRoots".

> https://babeljs.io/docs/en/config-files#root-babelconfigjson-file
>
> You can often place all of your repo configuration in the root `babel.config.json.` With "overrides", you can easily specify configuration that only applies to certain subfolders of your repository, which can often be easier to follow than creating many .babelrc.json files across the repo.
>
> The first issue you'll likely run into is that by default, Babel expects to load babel.config.json files from the directory set as its "root", which means that if you create a babel.config.json, but run Babel inside an individual package, e.g.
