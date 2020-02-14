## Goal

Allow parcel2 to pick up `.babelrc`, `babel.config.json` and `package.json` babel configurations in monorepos in a way that...

1. ...mirrors (as closely as possible) the way that the latest `babel-cli` works, so that users can apply their existing expectations to parcel with as few "gotchas" as possible.
2. ...does not add unnecessary, babel-specific configuration flags to parcel that are only used to tell it where to look for babel configuration (i.e. unlike the `babel-cli`, parcel (ideally) shouldn't burden the user with specifying things like [`rootMode`](https://babeljs.io/docs/en/config-files#root-babelconfigjson-file) or [`babelrcRoots`](https://babeljs.io/docs/en/options#babelrcroots)).

## Monorepo Scenarios

The table below outlines current `babel` and `parcel2` behavior in different scenarios within a monorepo, along with a proposal about how the behavior should be fixed.

| Config at root      | Config in sub-project | `babel-cli` result (running from root) | `babel-cli` result (running from sub-project with no special options) | Current `parcel` result (as of `2.0.0-nightly.99`) | Proposed fixes to `parcel` result\*\*                                                                                                      | Notes                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | --------------------- | -------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| nothing             | `.babelrc`\*          | sub-project ignored                    | sub-project respected                                                 | sub-project **ignored**                            | sub-project **respected**                                                                                                                  | Babel documentation [recommends](https://babeljs.io/docs/en/config-files#subpackage-babelrcjson-files) setting [`babelrcRoots`](https://babeljs.io/docs/en/options#babelrcroots) to enable detection when running `babel-cli` from the root.                                                                                                                                                |
| nothing             | `babel.config.json`   | sub-project ignored                    | sub-project respected                                                 | sub-project ignored                                | -                                                                                                                                          | In order to cause parcel to behave like babel, we would have to make it sensitive to the cwd (i.e. it would behave one way when run in a sub-package, and another way when run from the root), which seems sub-optimal. Since isn't a recommended babel config (i.e. expecting `babel.config.json` to affect only a sub-project, not the whole mono-repo), it seems okay to leave it as-is. |
| `.babelrc` \*       | nothing               | root ignored                           | root ignored                                                          | root ignored                                       | -                                                                                                                                          | It is expected that the root `.babelrc` file will be ignored, because file-relative configuration is not intended to be used for shared, cross-repo options.                                                                                                                                                                                                                                |
| `.babelrc` \*       | `.babelrc` \*         | both ignored                           | root ignored, sub-project respected                                   | both ignored                                       | root ignored, **sub-project respected**                                                                                                    | It is expected that the root `.babelrc` file will be ignored, because file-relative configuration is not intended to be used for shared, cross-repo options.                                                                                                                                                                                                                                |
| `.babelrc` \*       | `babel.config.json`   | both ignored                           | root ignored, sub-project respected                                   | both ignored                                       | -                                                                                                                                          | In order to cause parcel to behave like babel, we would have to make it sensitive to the cwd (i.e. it would behave one way when run in a sub-package, and another way when run from the root), which seems sub-optimal. Since isn't a recommended babel config (i.e. expecting `babel.config.json` to affect only a sub-project, not the whole mono-repo), it seems okay to leave it as-is. |
| `babel.config.json` | nothing               | root respected                         | root ignored                                                          | root respected                                     | -                                                                                                                                          | Babel documentation [recommends](https://babeljs.io/docs/en/config-files#root-babelconfigjson-file) setting `--rootMode upward` to enable detection when running `babel-cli` from the subproject.                                                                                                                                                                                           |
| `babel.config.json` | `.babelrc`\*          | root respected, sub-project ignored    | root ignored, sub-project respected                                   | root respected, sub-project **_ignored_**          | both root and sub-project **respected** (i.e. merged, as if you had correctly specified `babelrcRoot` and `rootMode` in babel cli options) | Babel documentation [recommends](https://babeljs.io/docs/en/config-files#subpackage-babelrcjson-files) setting [`babelrcRoots`](https://babeljs.io/docs/en/options#babelrcroots) _and_ `--rootMode upward` to enable detection in both cases. The proposed fix would accomplish a similar result on the users behalf without any extra parameters.                                          |
| `babel.config.json` | `babel.config.json`   | root respected, sub-project ignored    | root ignored, sub-project respected                                   | root respected, sub-project ignored                | -                                                                                                                                          | It is expected that the sub-project `babel.config.json` file will be ignored, because it is intended only to specify global configuration, not per-package overrides.                                                                                                                                                                                                                       |

\* or `package.json` with a `babel` property (i.e. a file-relative configuration).

\*\* Unlike `babel-cli`, `parcel` appears to behave the same WRT babel configuration whether it is run in the project root or in a sub-package (this is a good thing that we should keep, IMO).

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
