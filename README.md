
```
Usage: gh-submodule-add 
gh submodule-add <options>

  gh submodule-add -c '<[org1]/repo1>,...,<[orgN]/repoN>'

    Execute this command in the project root directory of the repo.
    This extension adds to the current repo the repos specified in the 
    comma separated list 
    'org1/repo1,org2/repo2', etc as git submodules of the current repo. 
    - If one of the 'org/repo' repos doesn't exist, it throws an error.

  gh submodule-add -f file
    
    The file has to have a repo per line

    

Options:
  -V, --version                              output the version number
  -d, --debug                                output extra debugging
  -s, --search <query>                       search <query >using GitHub Syntax
  -r, --regexp <regexp>                      filter <query> results using <regexp>
  -c, --csr <comma separated list of repos>  the list of repos is specified as a comma separated list
  -f, --file <file>                          file with the list of repos, one per line
  -n --dryrun                                just show what repos will be added as submodules
  -o --org <org>                             default organization or user
  -h, --help                                 display help for command
```