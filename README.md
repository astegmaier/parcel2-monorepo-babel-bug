# parcel2-monorepo-babel-bug

A demonstration of [an issue](https://github.com/parcel-bundler/parcel/issues/4120) in parcel2 where `.babelrc` files are not detected for monorepo packages.

## Repro steps

1. Clone the repo and run `yarn` to install dependencies
2. Switch to a sub-package (`app1`) of the monorepo by running `cd app1`.
3. The app contains a sample javascript file that uses class properties and jsx. There is a `.babelrc` file in the root of that package that contains references to the correct babel plugins. You can verify that the babel cli correctly picks up the provided `.babelrc` file by running `yarn babel`.
4. Try to build the app with parcel by running `yarn parcel`. Parcel will fail to read the `.babelrc` file, causing this error:
   ```
   @parcel/transformer-babel: Support for the experimental syntax 'classProperties' isn't currently enabled (2:11):
   SyntaxError: Support for the experimental syntax 'classProperties' isn't currently enabled (2:11):
       at Object.raise (/Users/Andrew/Projects/parcel-private/node_modules/@babel/parser/lib/index.js:7013:17)
       at Object.expectPlugin (/Users/Andrew/Projects/parcel-private/node_modules/@babel/parser/lib/index.js:8389:18)
       at Object.parseClassProperty (/Users/Andrew/Projects/parcel-private/node_modules/@babel/parser/lib/index.js:11665:12)
       at Object.parseClassProperty (/Users/Andrew/Projects/parcel-private/node_modules/@babel/parser/lib/index.js:2451:18)
       at Object.pushClassProperty (/Users/Andrew/Projects/parcel-private/node_modules/@babel/parser/lib/index.js:11627:30)
       at Object.parseClassMemberWithIsStatic (/Users/Andrew/Projects/parcel-private/node_modules/@babel/parser/lib/index.js:11560:14)
       at Object.parseClassMember (/Users/Andrew/Projects/parcel-private/node_modules/@babel/parser/lib/index.js:11497:10)
       at withTopicForbiddingContext (/Users/Andrew/Projects/parcel-private/node_modules/@babel/parser/lib/index.js:11452:14)
       at Object.withTopicForbiddingContext (/Users/Andrew/Projects/parcel-private/node_modules/@babel/parser/lib/index.js:10533:14)
       at Object.parseClassBody (/Users/Andrew/Projects/parcel-private/node_modules/@babel/parser/lib/index.js:11429:10)
   /Users/Andrew/Projects/parcel2-monorepo-babel-bug/app1/src/index.js:2:10
   1 | class MyClassWithProperties {
   > 2 |   message = "Hello from a class!";
   >   |          ^
   3 |   sayHello() {
   4 |     console.log(this.message);
   ```

## Proposed solution

See [parcel-goals.md](parcel-goals.md) for a proposal about what the behavior of parcel should be.
