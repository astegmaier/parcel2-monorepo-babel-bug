## The Original Issue

Parcel2 does not respect configuration from `.babelrc` files in monorepo sub-packages. See [Parcel issue #4120](https://github.com/parcel-bundler/parcel/issues/4120) and [the readme of this repository](/astegmaier/parcel2-monorepo-babel-bug/blob/master/README.md) for details about how to reproduce.

## Solution Goals

Allow parcel2 to pick up `.babelrc`, `babel.config.json` and `package.json` babel configurations in monorepos in a way that...

1. ...mirrors (as closely as possible) the way that the latest `babel-cli` works, so that users can apply their existing expectations to parcel with as few "gotchas" as possible.
2. ...does not add unnecessary, babel-specific configuration flags to parcel that are only used to tell it where to look for babel configuration (i.e. unlike the `babel-cli`, parcel (ideally) shouldn't burden the user with specifying things like [`rootMode`](https://babeljs.io/docs/en/config-files#root-babelconfigjson-file) or [`babelrcRoots`](https://babeljs.io/docs/en/options#babelrcroots)).

## Solution Scenarios

The table below outlines current `babel` and `parcel2` behavior in different scenarios within a monorepo, along with a proposal about how the behavior should be fixed (implemented in [PR #4132](https://github.com/parcel-bundler/parcel/pull/4132)).

| Config at root      | Config in sub-project | `babel-cli` result (running from root) | `babel-cli` result (running from sub-project) | Current `parcel` result (as of `2.0.0-nightly.99`)\*\* | [Proposed fixes](https://github.com/parcel-bundler/parcel/pull/4132) to `parcel` result\*\*                                                | Notes                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | --------------------- | -------------------------------------- | --------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| nothing             | `.babelrc`\*          | sub-project ignored                    | sub-project respected                         | sub-project **ignored**                                | sub-project **respected**                                                                                                                  | Babel documentation [recommends](https://babeljs.io/docs/en/config-files#subpackage-babelrcjson-files) setting [`babelrcRoots`](https://babeljs.io/docs/en/options#babelrcroots) to enable detection when running `babel-cli` from the root.                                                                                                                                                |
| nothing             | `babel.config.json`   | sub-project ignored                    | sub-project respected                         | sub-project ignored                                    | -                                                                                                                                          | In order to cause parcel to behave like babel, we would have to make it sensitive to the cwd (i.e. it would behave one way when run in a sub-package, and another way when run from the root), which seems sub-optimal. Since isn't a recommended babel config (i.e. expecting `babel.config.json` to affect only a sub-project, not the whole mono-repo), it seems okay to leave it as-is. |
| `.babelrc` \*       | nothing               | root ignored                           | root ignored                                  | root ignored                                           | -                                                                                                                                          | It is expected that the root `.babelrc` file will be ignored, because file-relative configuration is not intended to be used for shared, cross-repo options.                                                                                                                                                                                                                                |
| `.babelrc` \*       | `.babelrc` \*         | both ignored                           | root ignored, sub-project respected           | both **ignored**                                       | root ignored, **sub-project respected**                                                                                                    | It is expected that the root `.babelrc` file will be ignored, because file-relative configuration is not intended to be used for shared, cross-repo options.                                                                                                                                                                                                                                |
| `.babelrc` \*       | `babel.config.json`   | both ignored                           | root ignored, sub-project respected           | both ignored                                           | -                                                                                                                                          | In order to cause parcel to behave like babel, we would have to make it sensitive to the cwd (i.e. it would behave one way when run in a sub-package, and another way when run from the root), which seems sub-optimal. Since isn't a recommended babel config (i.e. expecting `babel.config.json` to affect only a sub-project, not the whole mono-repo), it seems okay to leave it as-is. |
| `babel.config.json` | nothing               | root respected                         | root ignored                                  | root respected                                         | -                                                                                                                                          | Babel documentation [recommends](https://babeljs.io/docs/en/config-files#root-babelconfigjson-file) setting `--rootMode upward` to enable detection when running `babel-cli` from the subproject.                                                                                                                                                                                           |
| `babel.config.json` | `.babelrc`\*          | root respected, sub-project ignored    | root ignored, sub-project respected           | root respected, sub-project **ignored**                | both root and sub-project **respected** (i.e. merged, as if you had correctly specified `babelrcRoot` and `rootMode` in babel cli options) | Babel documentation [recommends](https://babeljs.io/docs/en/config-files#subpackage-babelrcjson-files) setting [`babelrcRoots`](https://babeljs.io/docs/en/options#babelrcroots) _and_ `--rootMode upward` to enable detection in both cases. The proposed fix would accomplish a similar result on the users behalf without any extra parameters.                                          |
| `babel.config.json` | `babel.config.json`   | root respected, sub-project ignored    | root ignored, sub-project respected           | root respected, sub-project ignored                    | -                                                                                                                                          | It is expected that the sub-project `babel.config.json` file will be ignored, because it is intended only to specify global configuration, not per-package overrides.                                                                                                                                                                                                                       |

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

### Advice for monorepos

> https://babeljs.io/docs/en/config-files#monorepos
>
> With monorepo setups, the core thing to understand is that Babel treats your working directory as its logical "root", which causes problems if you want to run Babel tools within a specific sub-package without having Babel apply to the repo as a whole.
>
> Separately, it is also important to decide if you want to use `.babelrc.json` files or just a central `babel.config.json`. `.babelrc.json` files are not required for subfolder-specific configuration like they were in Babel 6, so often they are not needed in Babel 7, in favor of `babel.config.json`.
>
> ### Root babel.config.json file
>
> You can often place all of your repo configuration in the root `babel.config.json.` With "overrides", you can easily specify configuration that only applies to certain subfolders of your repository, which can often be easier to follow than creating many .babelrc.json files across the repo.
>
> The first issue you'll likely run into is that by default, Babel expects to load babel.config.json files from the directory set as its "root", which means that if you create a babel.config.json, but run Babel inside an individual package, e.g.
>
> ```
> cd packages/some-package;
> babel src -d dist
> ```
>
> the "root" Babel is using in that context is not your monorepo root, and it won't be able to find the babel.config.json file.
>
> If all of your build scripts run relative to your repository root, things should already work, but if you are running your Babel compilation process from within a subpackage, you need to tell Babel where to look for the config. There are a few ways to do that, but the recommended way is the "rootMode" option with "upward", which will make Babel search from the working directory upward looking for your `babel.config.json` file, and will use its location as the "root" value.
>
> ...
>
> ### Subpackage .babelrc.json files
>
> Similar to the the way babel.config.json files are required to be in the "root", .babelrc.json files must be in the root package, by default. This means that, the same way the working directory affects babel.config.json loading, it also affects .babelrc.json loading.
>
> Assuming you've already gotten your babel.config.json file loaded properly as discussed above, Babel will only process .babelrc.json files inside that root package (and not subpackages), so given for instance
>
> ```
> package.json
> babel.config.js
> packages/
>   mod/
>    package.json
>    .babelrc.json
>    index.js
> ```
>
> compiling the packages/mod/index.js file will not load packages/mod/.babelrc.json because this .babelrc.json is within a sub-package, not the root package.
>
> To enable processing of that .babelrc.json, you will want to use the "babelrcRoots" option from inside your babel.config.json file to do
>
> ```
> babelrcRoots: [
>   ".",
>   "packages/*",
> ],
> ```
>
> so that Babel will consider all packages/\* packages as allowed to load .babelrc.json files, along with the original repo root.
