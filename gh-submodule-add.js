const ins = require("util").inspect;
const deb = (...args) => { 
    if (debug) console.log(ins(...args, {depth: null})); 
};

const path = require('path');
const fs = require("fs");
const shell = require('shelljs');

const { 
  showError, 
  sh, 
  shContinue, shStderr, gh, 
  ghCont, 
  ghCode, 
  names2urls, 
  getUserLogin,
  getRepoListFromFile, 
  getRepoListFromAPISearch,
  getNumberOfCommits,
  branches,
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
let repoList = getRepoList(options, org);

if (repoList.length === 0) {
  console.log(`No matching repos found in owner "${org}"!`);
  process.exit(0);
}

let repos = repoList.split(/\s*,\s*/);

repos = addImplicitOrgIfNeeded(repos, org);

if (options.regexp) {
    let regexp = new RegExp(options.regexp,'i');
    repos = repos.filter(rn => {
      return regexp.test(rn)
    });
}

if (options.dryrun) {
    console.error("Only repos with more than one commit will be added as submodules:")

    repos.forEach(r => {
      if (RepoIsEmpty(r)) { 
        console.error(`${r} is empty!`);
        return;
      }
      console.log(r);
    });

    process.exit(0);
}

let urls = names2urls(repos);
deb(urls);

addSubmodules(urls, repos);