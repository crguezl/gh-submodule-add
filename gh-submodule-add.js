const ins = require("util").inspect;
const deb = (...args) => { 
    if (debug) console.log(ins(...args, {depth: null})); 
};

const path = require('path');
const fs = require("fs");
const shell = require('shelljs');

const { 
  showError, 
  //sh, 
  //shContinue, shStderr, gh, 
  //ghCont, 
  //ghCode, 
  names2urls, 
  getUserLogin,
  //getRepoListFromFile, 
  //getRepoListFromAPISearch,
  //getNumberOfCommits,
  //branches,
  numBranches,
  RepoIsEmpty,
  getRepoList,
  addImplicitOrgIfNeeded,
  addSubmodules
} = require(path.join(__dirname,'utilities.js'));

const { Command } = require('commander');

const program = new Command();
program.version(require('./package.json').version);

program
  .name("gh submodule-add [options] [organization]")
  .option('-d, --debug', 'output extra debugging')
  .option('-s, --search <query>', "search <query> using GitHub Search API. A dot '.' refers to all the repos")
  .option('-r, --regexp <regexp>', 'filter <query> results using <regexp>')
  .option('-c, --csr <comma separated list of repos>', 'the list of repos is specified as a comma separated list')
  .option('-f, --file <file>', 'file with the list of repos, one per line')
  .option('-n --dryrun','just show what repos will be added as submodules')
  .option('-o --org <org>', 'default organization or user');

program.addHelpText('after', `
  - You can set the default organization through the GITHUB_ORG environment variable
  - When using the option '-s', a dot '.' refers to all the repos
  - Option '-s' works only when all the repos belong to the same org
  - Use of one and only one of the options '-s' or '-c'  or '-f' it is required
  - The current folder must be the root of a git repo unless option '-n' is used
`
);
  
program.parse(process.argv);
if (process.argv.length === 2) program.help()

const debug = program.debug; 

const options = program.opts();
deb(options);

if (!shell.which('git')) {
  showError('Sorry, this extension requires git installed!');
}
if (!shell.which('gh')) {
    showError('Sorry, this extension requires GitHub Cli (gh) installed!');
}

if (!options.dryrun) {
  let isGitFolder = shell.exec("git rev-parse --is-inside-work-tree", {silent: true});
   if (!isGitFolder || !fs.existsSync(".git")) {
    showError('The current folder must be the root of a git repo when running this command!');
  }
}


debugger;
if (!options.org && (program.args.length == 1) ) options.org = program.args[0];

let org = options.org || process.env["GITHUB_ORG"] || getUserLogin();
let repos = getRepoList(options, org);

if (repos.length === 0) {
  console.log(`No matching repos found in owner "${org}"!`);
  process.exit(0);
}

if (options.regexp) {
    let regexp = new RegExp(options.regexp,'i');
    repos = repos.filter(rn => {
      return regexp.test(rn)
    });
}

if (options.dryrun) {

    console.error("Only repos with more than one commit will be added as submodules:")

    //console.log(repos);
    let nb = numBranches(repos)
    repos.forEach((r,i) => {
      if (nb[i] === 0)
        console.error(`${r} is empty!`);
      else console.log(r);
    });

    process.exit(0);
}

let urls = names2urls(repos);

addSubmodules(urls, repos);

/*

######### UNIFIED graphQL NO parallelism in the downloads of repos

# unified graphql request for empty repos download complete of 1 repo
➜  asyncserialize git:(master) ✗ time gh submodule-add -s 'asyncserialize' --org ULL-MII-SYTWS-2122
Skipping to add repo https://github.com/ULL-MII-SYTWS-2122/asyncserialize-lorenaolaru because is empty!
Skipping to add repo https://github.com/ULL-MII-SYTWS-2122/asyncserialize-mstoisor because is empty!
Skipping to add repo https://github.com/ULL-MII-SYTWS-2122/asyncserialize-crguezl because is empty!
Skipping to add repo https://github.com/ULL-MII-SYTWS-2122/asyncserialize-ddialar because is empty!
git submodule add https://github.com/ULL-MII-SYTWS-2122/asyncserialize-alu0101102726
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/sytws2122/practicas-alumnos/asyncserialize/asyncserialize-alu0101102726'...
Skipping to add repo https://github.com/ULL-MII-SYTWS-2122/asyncserialize-PaulaExposito because is empty!
gh submodule-add -s 'asyncserialize' --org ULL-MII-SYTWS-2122  0,99s user 0,43s system 36% cpu 3,946 total

# unified graphql request for empty repos -n option. No downloads
➜  asyncserialize git:(master) ✗ time gh submodule-add -s asyncserialize -o ULL-MII-SYTWS-2122 -n
Only repos with more than one commit will be added as submodules:
ULL-MII-SYTWS-2122/asyncserialize-mstoisor is empty!
ULL-MII-SYTWS-2122/asyncserialize-lorenaolaru is empty!
ULL-MII-SYTWS-2122/asyncserialize-crguezl is empty!
ULL-MII-SYTWS-2122/asyncserialize-ddialar is empty!
ULL-MII-SYTWS-2122/asyncserialize-alu0101102726
ULL-MII-SYTWS-2122/asyncserialize-PaulaExposito is empty!
gh submodule-add -s asyncserialize -o ULL-MII-SYTWS-2122 -n  0,39s user 0,15s system 26% cpu 2,040 total

# unified graphql request for empty repos -n option. 16 repos. No downloads
➜  aprender-markdown git:(master) ✗ time gh submodule-add -s aprender-markdown --org ULL-MFP-AET-2122 -n
Only repos with more than one commit will be added as submodules:
ULL-MFP-AET-2122/aprender-markdown-anabel-coello-perez-alu0100885200
ULL-MFP-AET-2122/aprender-markdown-alejandro-gonzalez-sarasola-alu0100260076
ULL-MFP-AET-2122/aprender-markdown-wim-van-hoye-alu0101520377
ULL-MFP-AET-2122/aprender-markdown-adela-gonzalez-maury-alu0101116204
ULL-MFP-AET-2122/aprender-markdown-ivan-gonzalez-aguiar-alu0100551266
ULL-MFP-AET-2122/aprender-markdown-carlos-guerra-olivera-alu0100703535
ULL-MFP-AET-2122/aprender-markdown-adrian-prieto-curbelo_alu0100948387
ULL-MFP-AET-2122/aprender-markdown-manuel_curbelo_alu0100045130
ULL-MFP-AET-2122/aprender-markdown-chloe-boistel-perez-alu0100788020
ULL-MFP-AET-2122/aprender-markdown-noelia-rodriguez-hernandez-alu0100595420
ULL-MFP-AET-2122/aprender-markdown-alejandro-marrero-diaz-alu100825008
ULL-MFP-AET-2122/aprender-markdown-yeray_exposito_garcia_alu0100951844
ULL-MFP-AET-2122/aprender-markdown-angel-ramallobenitez-alu0100312898
ULL-MFP-AET-2122/aprender-markdown-nestor-gonzalez-lopez-alu0100108859
ULL-MFP-AET-2122/aprender-markdown-jaime-garcia-bullejos-alu0100906806
ULL-MFP-AET-2122/gitpod-template
gh submodule-add -s aprender-markdown --org ULL-MFP-AET-2122 -n  0,40s user 0,16s system 26% cpu 2,122 total

# Unified graphql request for empty repos -n option. 16 downloads

git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-anabel-coello-perez-alu0100885200
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-anabel-coello-perez-alu0100885200'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-alejandro-gonzalez-sarasola-alu0100260076
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-alejandro-gonzalez-sarasola-alu0100260076'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-adela-gonzalez-maury-alu0101116204
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-adela-gonzalez-maury-alu0101116204'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-wim-van-hoye-alu0101520377
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-wim-van-hoye-alu0101520377'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-ivan-gonzalez-aguiar-alu0100551266
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-ivan-gonzalez-aguiar-alu0100551266'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-adrian-prieto-curbelo_alu0100948387
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-adrian-prieto-curbelo_alu0100948387'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-manuel_curbelo_alu0100045130
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-manuel_curbelo_alu0100045130'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-carlos-guerra-olivera-alu0100703535
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-carlos-guerra-olivera-alu0100703535'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-chloe-boistel-perez-alu0100788020
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-chloe-boistel-perez-alu0100788020'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-noelia-rodriguez-hernandez-alu0100595420
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-noelia-rodriguez-hernandez-alu0100595420'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-alejandro-marrero-diaz-alu100825008
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-alejandro-marrero-diaz-alu100825008'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-angel-ramallobenitez-alu0100312898
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-angel-ramallobenitez-alu0100312898'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-nestor-gonzalez-lopez-alu0100108859
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-nestor-gonzalez-lopez-alu0100108859'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-yeray_exposito_garcia_alu0100951844
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-yeray_exposito_garcia_alu0100951844'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-jaime-garcia-bullejos-alu0100906806
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-jaime-garcia-bullejos-alu0100906806'...
git submodule add https://github.com/ULL-MFP-AET-2122/gitpod-template
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/gitpod-template'...
gh submodule-add -s aprender-markdown --org ULL-MFP-AET-2122  4,05s user 2,63s system 27% cpu 24,702 total

### Sequential

# 16 repos no downloads
➜  aprender-markdown git:(master) ✗ time gh submodule-add -s 'aprender-markdown' --org ULL-MFP-AET-2122 -n
Only repos with more than one commit will be added as submodules:
ULL-MFP-AET-2122/aprender-markdown-anabel-coello-perez-alu0100885200
ULL-MFP-AET-2122/aprender-markdown-adela-gonzalez-maury-alu0101116204
ULL-MFP-AET-2122/aprender-markdown-alejandro-gonzalez-sarasola-alu0100260076
ULL-MFP-AET-2122/aprender-markdown-wim-van-hoye-alu0101520377
ULL-MFP-AET-2122/aprender-markdown-adrian-prieto-curbelo_alu0100948387
ULL-MFP-AET-2122/aprender-markdown-manuel_curbelo_alu0100045130
ULL-MFP-AET-2122/aprender-markdown-carlos-guerra-olivera-alu0100703535
ULL-MFP-AET-2122/aprender-markdown-noelia-rodriguez-hernandez-alu0100595420
ULL-MFP-AET-2122/aprender-markdown-ivan-gonzalez-aguiar-alu0100551266
ULL-MFP-AET-2122/aprender-markdown-chloe-boistel-perez-alu0100788020
ULL-MFP-AET-2122/aprender-markdown-alejandro-marrero-diaz-alu100825008
ULL-MFP-AET-2122/aprender-markdown-angel-ramallobenitez-alu0100312898
ULL-MFP-AET-2122/aprender-markdown-nestor-gonzalez-lopez-alu0100108859
ULL-MFP-AET-2122/aprender-markdown-yeray_exposito_garcia_alu0100951844
ULL-MFP-AET-2122/aprender-markdown-jaime-garcia-bullejos-alu0100906806
ULL-MFP-AET-2122/gitpod-template
gh submodule-add -s 'aprender-markdown' --org ULL-MFP-AET-2122 -n  2,33s user 0,83s system 26% cpu 11,815 total

➜  aprender-markdown git:(master) ✗ time gh submodule-add -s 'aprender-markdown' --org ULL-MFP-AET-2122
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-anabel-coello-perez-alu0100885200
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-anabel-coello-perez-alu0100885200'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-alejandro-gonzalez-sarasola-alu0100260076
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-alejandro-gonzalez-sarasola-alu0100260076'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-wim-van-hoye-alu0101520377
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-wim-van-hoye-alu0101520377'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-adela-gonzalez-maury-alu0101116204
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-adela-gonzalez-maury-alu0101116204'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-ivan-gonzalez-aguiar-alu0100551266
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-ivan-gonzalez-aguiar-alu0100551266'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-carlos-guerra-olivera-alu0100703535
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-carlos-guerra-olivera-alu0100703535'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-adrian-prieto-curbelo_alu0100948387
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-adrian-prieto-curbelo_alu0100948387'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-manuel_curbelo_alu0100045130
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-manuel_curbelo_alu0100045130'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-chloe-boistel-perez-alu0100788020
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-chloe-boistel-perez-alu0100788020'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-noelia-rodriguez-hernandez-alu0100595420
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-noelia-rodriguez-hernandez-alu0100595420'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-alejandro-marrero-diaz-alu100825008
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-alejandro-marrero-diaz-alu100825008'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-yeray_exposito_garcia_alu0100951844
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-yeray_exposito_garcia_alu0100951844'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-angel-ramallobenitez-alu0100312898
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-angel-ramallobenitez-alu0100312898'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-nestor-gonzalez-lopez-alu0100108859
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-nestor-gonzalez-lopez-alu0100108859'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-jaime-garcia-bullejos-alu0100906806
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-jaime-garcia-bullejos-alu0100906806'...
git submodule add https://github.com/ULL-MFP-AET-2122/gitpod-template
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/gitpod-template'...
gh submodule-add -s 'aprender-markdown' --org ULL-MFP-AET-2122  5,96s user 3,25s system 27% cpu 33,934 total
*/