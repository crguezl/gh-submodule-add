## Installation

```
gh extension install crguezl/gh-submodule-add
```

## Usage

```
Usage: gh submodule-add [options]

Options:
  -V, --version                              output the version number
  -d, --debug                                output extra debugging
  -s, --search <query>                       search <query> using GitHub Search API. A dot '.' refers to all the repos
  -r, --regexp <regexp>                      filter <query> results using <regexp>
  -c, --csr <comma separated list of repos>  the list of repos is specified as a comma separated list
  -f, --file <file>                          file with the list of repos, one per line
  -n --dryrun                                just show what repos will be added as submodules
  -o --org <org>                             default organization or user
  -h, --help                                 display help for command
```

- You can set the default organization through the `GITHUB_ORG` environment variable
- When using the option `-s`, a dot `'.'` refers to all the repos
- Use of one and only one of the options `-s` or `-c`  or `-f` it is required


## Examples

An example of a dry-run:

```
➜  asyncmap git:(master) gh submodule-add -n -s asyncmap -o ULL-MII-SYTWS-2122
Only repos with more than one commit will be added as submodules:
ULL-MII-SYTWS-2122/asyncmap-ddialar
ULL-MII-SYTWS-2122/asyncmap-lorenaolaru
ULL-MII-SYTWS-2122/asyncmap-mstoisor
ULL-MII-SYTWS-2122/asyncmap-alu0101102726
ULL-MII-SYTWS-2122/asyncmap-crguezl
ULL-MII-SYTWS-2122/asyncmap-Pmolmar
ULL-MII-SYTWS-2122/asyncmap-PaulaExposito
ULL-MII-SYTWS-2122/asyncmap-alu0100898293
```

Refined with the regexp option:

```
➜  asyncmap git:(master) gh submodule-add -n -s asyncmap -r 'alu|paula' -o ULL-MII-SYTWS-2122
Only repos with more than one commit will be added as submodules:
ULL-MII-SYTWS-2122/asyncmap-alu0101102726
ULL-MII-SYTWS-2122/asyncmap-PaulaExposito
ULL-MII-SYTWS-2122/asyncmap-alu0100898293
```

Let us add these to the current repo as submodules:

```
➜  asyncmap git:(master) gh submodule-add -s asyncmap -r 'alu|paula' -o ULL-MII-SYTWS-2122
git submodule add https://github.com/ULL-MII-SYTWS-2122/asyncmap-alu0101102726
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/sytws2122/practicas-alumnos/asyncmap/asyncmap-alu0101102726'...
git submodule add https://github.com/ULL-MII-SYTWS-2122/asyncmap-alu0100898293
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/sytws2122/practicas-alumnos/asyncmap/asyncmap-alu0100898293'...
git submodule add https://github.com/ULL-MII-SYTWS-2122/asyncmap-PaulaExposito
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/sytws2122/practicas-alumnos/asyncmap/asyncmap-PaulaExposito'...
```

Let us check they have been added:

```
➜  asyncmap git:(master) ✗ git submodule
 90d05fd8879c13ba30dbe030380b2d2295754c5f asyncmap-PaulaExposito (heads/main)
 3140fdea99b588f9926b2debe22e10850412bd33 asyncmap-alu0100898293 (heads/main)
 e9b424dc5805da2fedc9d540da020b1d69728bab asyncmap-alu0101102726 (heads/main)
```

More Examples in repo [crguezl/test-gh-submodule-add](https://github.com/crguezl/test-gh-submodule-add)

## See also

* [gh extension to remove submodules](https://github.com/crguezl/gh-submodule-rm/blob/main/gh-submodule-rm)