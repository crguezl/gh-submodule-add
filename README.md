## Installation

```
gh extension install crguezl/gh-submodule-add
```

## Usage

```
➜  aprender-markdown git:(master) ✗ gh submodule-add
Usage: gh submodule-add [options] [organization] [options]

Options:
  -V, --version                              output the version number
  -d, --debug                                output extra debugging
  -s, --search <query>                       search <query> using GitHub Search API. A dot '.' refers to all the repos
  -r, --regexp <regexp>                      filter <query> results using <regexp>
  -c, --csr <comma separated list of repos>  the list of repos is specified as a comma separated list
  -f, --file <file>                          file with the list of repos, one per line
  -n --dryrun                                just show what repos will be added as submodules
  -o --org <org>                             default organization or user
  -p --parallel <int>                        number of concurrent  processes during the cloning stage (default: 8)
  -h, --help                                 display help for command
```

  - You can set the default organization through the GITHUB_ORG environment variable
  - When using the option '-s', a dot '.' refers to all the repos
  - Option '-s' works only when all the repos belong to the same org
  - Use of one and only one of the options '-s' or '-c'  or '-f' it is required
  - The current folder must be the root of a git repo unless option '-n' is used

## Examples

An example of a run with 16 repos downloaded:

```
➜  aprender-markdown git:(master) time gh submodule-add  -s markdown ULL-MFP-AET-2122
```

In a first stage, the repos are cloned concurrently:

```
cloning with 8 concurrent processes ...
[0] Clonando en 'aprender-markdown-alejandro-marrero-diaz-alu100825008'...
[1] Clonando en 'aprender-markdown-wim-van-hoye-alu0101520377'...
[2] Clonando en 'aprender-markdown-alejandro-gonzalez-sarasola-alu0100260076'...
[3] Clonando en 'aprender-markdown-anabel-coello-perez-alu0100885200'...
[4] Clonando en 'aprender-markdown-angel-ramallobenitez-alu0100312898'...
[5] Clonando en 'aprender-markdown-nestor-gonzalez-lopez-alu0100108859'...
[6] Clonando en 'aprender-markdown-noelia-rodriguez-hernandez-alu0100595420'...
[7] Clonando en 'latex-markdown-casiano-rodriguez-leon-crguezl'...
[1] git clone https://github.com/ULL-MFP-AET-2122/aprender-markdown-wim-van-hoye-alu0101520377.git exited with code 0
[8] Clonando en 'aprender-markdown-jaime-garcia-bullejos-alu0100906806'...
[6] git clone https://github.com/ULL-MFP-AET-2122/aprender-markdown-noelia-rodriguez-hernandez-alu0100595420.git exited with code 0
[5] git clone https://github.com/ULL-MFP-AET-2122/aprender-markdown-nestor-gonzalez-lopez-alu0100108859.git exited with code 0
[9] Clonando en 'aprender-markdown-yeray_exposito_garcia_alu0100951844'...
[2] git clone https://github.com/ULL-MFP-AET-2122/aprender-markdown-alejandro-gonzalez-sarasola-alu0100260076.git exited with code 0
[10] Clonando en 'aprender-markdown-adrian-prieto-curbelo_alu0100948387'...
[3] git clone https://github.com/ULL-MFP-AET-2122/aprender-markdown-anabel-coello-perez-alu0100885200.git exited with code 0
[11] Clonando en 'aprender-markdown-manuel_curbelo_alu0100045130'...
[12] Clonando en 'aprender-markdown-carlos-guerra-olivera-alu0100703535'...
[0] git clone https://github.com/ULL-MFP-AET-2122/aprender-markdown-alejandro-marrero-diaz-alu100825008.git exited with code 0
[13] Clonando en 'aprender-markdown-adela-gonzalez-maury-alu0101116204'...
[4] git clone https://github.com/ULL-MFP-AET-2122/aprender-markdown-angel-ramallobenitez-alu0100312898.git exited with code 0
[14] Clonando en 'aprender-markdown-chloe-boistel-perez-alu0100788020'...
[7] git clone https://github.com/ULL-MFP-AET-2122/latex-markdown-casiano-rodriguez-leon-crguezl.git exited with code 0
[15] Clonando en 'aprender-markdown-ivan-gonzalez-aguiar-alu0100551266'...
[10] git clone https://github.com/ULL-MFP-AET-2122/aprender-markdown-adrian-prieto-curbelo_alu0100948387.git exited with code 0
[16] Clonando en 'gitpod-template'...
[12] git clone https://github.com/ULL-MFP-AET-2122/aprender-markdown-carlos-guerra-olivera-alu0100703535.git exited with code 0
[8] git clone https://github.com/ULL-MFP-AET-2122/aprender-markdown-jaime-garcia-bullejos-alu0100906806.git exited with code 0
[13] git clone https://github.com/ULL-MFP-AET-2122/aprender-markdown-adela-gonzalez-maury-alu0101116204.git exited with code 0
[15] git clone https://github.com/ULL-MFP-AET-2122/aprender-markdown-ivan-gonzalez-aguiar-alu0100551266.git exited with code 0
[14] git clone https://github.com/ULL-MFP-AET-2122/aprender-markdown-chloe-boistel-perez-alu0100788020.git exited with code 0
[9] git clone https://github.com/ULL-MFP-AET-2122/aprender-markdown-yeray_exposito_garcia_alu0100951844.git exited with code 0
[16] git clone https://github.com/ULL-MFP-AET-2122/gitpod-template.git exited with code 0
[11] git clone https://github.com/ULL-MFP-AET-2122/aprender-markdown-manuel_curbelo_alu0100045130.git exited with code 0
```

In a second stage they are sequentially added as submodules to the current repo:

```
Agregando el repositorio existente en 'aprender-markdown-alejandro-marrero-diaz-alu100825008' al índice
Agregando el repositorio existente en 'aprender-markdown-wim-van-hoye-alu0101520377' al índice
Agregando el repositorio existente en 'aprender-markdown-alejandro-gonzalez-sarasola-alu0100260076' al índice
Agregando el repositorio existente en 'aprender-markdown-anabel-coello-perez-alu0100885200' al índice
Agregando el repositorio existente en 'aprender-markdown-angel-ramallobenitez-alu0100312898' al índice
Agregando el repositorio existente en 'aprender-markdown-nestor-gonzalez-lopez-alu0100108859' al índice
Agregando el repositorio existente en 'aprender-markdown-noelia-rodriguez-hernandez-alu0100595420' al índice
Agregando el repositorio existente en 'latex-markdown-casiano-rodriguez-leon-crguezl' al índice
Agregando el repositorio existente en 'aprender-markdown-jaime-garcia-bullejos-alu0100906806' al índice
Agregando el repositorio existente en 'aprender-markdown-yeray_exposito_garcia_alu0100951844' al índice
Agregando el repositorio existente en 'aprender-markdown-adrian-prieto-curbelo_alu0100948387' al índice
Agregando el repositorio existente en 'aprender-markdown-manuel_curbelo_alu0100045130' al índice
Agregando el repositorio existente en 'aprender-markdown-carlos-guerra-olivera-alu0100703535' al índice
Agregando el repositorio existente en 'aprender-markdown-adela-gonzalez-maury-alu0101116204' al índice
Agregando el repositorio existente en 'aprender-markdown-chloe-boistel-perez-alu0100788020' al índice
Agregando el repositorio existente en 'aprender-markdown-ivan-gonzalez-aguiar-alu0100551266' al índice
Agregando el repositorio existente en 'gitpod-template' al índice
gh submodule-add -s markdown ULL-MFP-AET-2122  4,52s user 2,96s system 65% cpu 11,464 total
```

After that, the submodules are left in the stage:

```
➜  aprender-markdown git:(master) ✗ git status
En la rama master

No hay commits todavía

Cambios a ser confirmados:
  (usa "git rm --cached <archivo>..." para sacar del área de stage)
	nuevo archivo:  .gitmodules
	nuevo archivo:  aprender-markdown-adela-gonzalez-maury-alu0101116204
	nuevo archivo:  aprender-markdown-adrian-prieto-curbelo_alu0100948387
	nuevo archivo:  aprender-markdown-alejandro-gonzalez-sarasola-alu0100260076
	nuevo archivo:  aprender-markdown-alejandro-marrero-diaz-alu100825008
	nuevo archivo:  aprender-markdown-anabel-coello-perez-alu0100885200
	nuevo archivo:  aprender-markdown-angel-ramallobenitez-alu0100312898
	nuevo archivo:  aprender-markdown-carlos-guerra-olivera-alu0100703535
	nuevo archivo:  aprender-markdown-chloe-boistel-perez-alu0100788020
	nuevo archivo:  aprender-markdown-ivan-gonzalez-aguiar-alu0100551266
	nuevo archivo:  aprender-markdown-jaime-garcia-bullejos-alu0100906806
	nuevo archivo:  aprender-markdown-manuel_curbelo_alu0100045130
	nuevo archivo:  aprender-markdown-nestor-gonzalez-lopez-alu0100108859
	nuevo archivo:  aprender-markdown-noelia-rodriguez-hernandez-alu0100595420
	nuevo archivo:  aprender-markdown-wim-van-hoye-alu0101520377
	nuevo archivo:  aprender-markdown-yeray_exposito_garcia_alu0100951844
	nuevo archivo:  gitpod-template
	nuevo archivo:  latex-markdown-casiano-rodriguez-leon-crguezl
```

## See also

* [gh extension to remove submodules](https://github.com/crguezl/gh-submodule-rm/blob/main/gh-submodule-rm)