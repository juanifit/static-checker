# STATIC CHECKER

Gathers all the keys or functions of a keyword "x" called within a repository, compares the signatures of those keys between two packages.

## USAGE

At the command line:

`node checkModuleFunctions.js [keyword/moduleName] [path to repository to check] [path to module1] [path to module2]

Example: 
`node checkModuleFunctions.js async '/path/to/repository' '/path/to/oldModule' '/path/to/newModule'`


Not perfect, but raises confidence level a bit.


Requires the following linux utilities to be installed: 
- ag
- sed
- sort
- uniq
