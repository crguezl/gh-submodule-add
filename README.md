## Synopsis

With option `-C` clones a set of repos from a specified organization. 
If `-C` is omitted and the command is executed inside a repo, the cloned repos will be added as submodules to the current repo.

## Installation

```
gh extension install crguezl/gh-submodule-add
```

or you can use this other location:
  
```
gh extension install gh-cli-for-education/gh-submodule-add
```

## Requirements

Node.js has to be installed.
To have fzf installed is convenient but not essential.

## Usage

```
Usage: gh submodule-add [options] [organization] -- [git submodule options]

Options:
  -V, --version                              output the version number
  -s, --search <query>                       search <query> using GitHub Search API
  -r, --regexp <regexp>                      filter <query> results using <regexp>
  -c, --csr <comma separated list of repos>  the list of repos is specified as a comma separated list
  -f, --file <file>                          file with the list of repos, one per line
  -n --dryrun                                just show what repos will be added as submodules
  -C --clone                                 clone only. Skip submodule adds and aborbgitdirs steps
  -o --org <org>                             organization or user
     --default                               Implies "-o <org>". Set "org" as default organization for future uses
  -D --depth <depth>                         Create a shallow clone with a history truncated to <depth> number of commits
  -d, --debug                                output extra debugging
  -p --parallel <int>                        number of concurrent  processes during the cloning stage (default: 2)
  -h, --help                                 display help for command
```


- If the organization is not explicitly specified,
  the selection will be done interactively among the list of your organizations
- You can set the default organization through the "--default" option for future uses of this program
- If no repos are specified the selection of repos will be done interactively among the repos in the org
- Option '-s' assumes all the repos belong to the same org
- When called with option  '-s .', the dot '.' refers to all the repos.  fzf will be open to select the repos
- The current folder must be the root of a git repo unless options '-n' or '-C' are used
- When in fzf, use CTRL-A to select all, tab to select/deselect

## Examples

The following example clones all the repos  from org `ULL-MFP-AET-2122`  that are in the GitHub Classroom Assignment `latex-markdown`  and  match the regular expression `/marrero|maury|coell/`

```
 gh submodule-add -C -o ULL-MFP-AET-2122 -s latex-markdown -r 'marrero|maury|coell'
cloning with 2 concurrent processes ...
[0] Clonando en 'latex-markdown-alejandro-marrero-diaz-alu100825008'...
[1] Clonando en 'latex-markdown-adela-gonzalez-maury-alu0101116204'...
[0] git clone https://github.com/ULL-MFP-AET-2122/latex-markdown-alejandro-marrero-diaz-alu100825008.git exited with code 0
[2] Clonando en 'latex-markdown-anabel-coello-perez-alu0100885200'...
[1] git clone https://github.com/ULL-MFP-AET-2122/latex-markdown-adela-gonzalez-maury-alu0101116204.git exited with code 0
[2] git clone https://github.com/ULL-MFP-AET-2122/latex-markdown-anabel-coello-perez-alu0100885200.git exited with code 0
```

## Default Org Alias

I use this extension in combination with these two alias:

```
$ gh alias set cd '!gh config set current-org "$1" 2>/dev/null'
$ gh alias set pwd !'gh config get current-org'
```

Example of use: 

```
$ gh cd ULL-MII-SYTWS-2122
$ gh pwd
ULL-MII-SYTWS-2122
$ gh cd ''
$ gh pwd
```

## See also

* [gh extension to remove submodules](https://github.com/crguezl/gh-submodule-rm/blob/main/gh-submodule-rm)
* [gh crguezl/org-clone](https://github.com/crguezl/gh-org-clone)
* [gh crguezl/gh-org-members](https://github.com/crguezl/gh-org-members)