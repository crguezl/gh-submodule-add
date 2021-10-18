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

- You can set the default organization through the GITHUB_ORG environment variable
- When using the option '-s', a dot '.' refers to all the repos
- Use of one and only one of the options '-s' or '-c'  or '-f' it is required


## Examples

* Examples in repo [crguezl/test-gh-submodule-add](https://github.com/crguezl/test-gh-submodule-add)

## See also

* [gh extension to remove submodules](https://github.com/crguezl/gh-submodule-rm/blob/main/gh-submodule-rm)