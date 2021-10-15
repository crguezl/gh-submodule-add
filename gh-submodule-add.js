const ins = require("util").inspect;
const deb = (...args) => { 
    if (debug) console.log(ins(...args, {depth: null})); 
};

const fs = require("fs");
const shell = require('shelljs');
const { Command } = require('commander');

const help = 
`
gh submodule-add <options>

  gh submodule-add -c '<[org1]/repo1>,...,<[orgN]/repoN>'

    Execute this command in the project root directory of the repo.
    This extension adds to the current repo the repos specified in the 
    comma separated list 
    'org1/repo1,org2/repo2', etc as git submodules of the current repo. 
    - If one of the 'org/repo' repos doesn't exist, it throws an error.

  gh submodule-add -f file
    
    The file has to have a repo per line

    `

const program = new Command();
program.version(require('./package.json').version);

program
  .usage(help)
  .option('-d, --debug', 'output extra debugging')
  .option('-s, --search <query>', 'search <query >using GitHub Syntax')
  .option('-r, --regexp <regexp>', 'filter <query> results using <regexp>')
  .option('-c, --csr <comma separated list of repos>', 'the list of repos is specified as a comma separated list')
  .option('-f, --file <file>', 'file with the list of repos, one per line')
  .option('-n --dryrun','just show what repos will be added as submodules')
  .option('-o --org <org>', 'default organization or user');

program.parse(process.argv);
const debug = program.debug; 

const options = program.opts();
deb(options);

if (!shell.which('git')) {
  usage('Sorry, this extension requires git installed!');
}
if (!shell.which('gh')) {
    usage('Sorry, this extension requires GitHub Cli (gh) installed!');
}

const isGitFolder = sh("git rev-parse --is-inside-work-tree");
deb("this folder is a git folder? ",isGitFolder);

if (!isGitFolder || !fs.existsSync(".git")) {
    usage('Sorry, current folder is not the root of a git repo!');
}

function usage(error) {

    if (error) console.error(`Error!: ${error}`);
    console.log(help)
    if (error) process.exit(1); else process.exit(0);
}

function sh(executable, ...args) {
    let command = `${executable} ${args.join('')}`;
    deb(command);
    let result = shell.exec(command, {silent: false});
    if (result.code !== 0) {
      shell.echo(`Error: Command "${command}" failed\n${result.stderr}`);
      shell.exit(result.code);
    }    
    return result.stdout;
}


const gh = (...args) => sh("gh", ...args);
const git = (...args) => sh("git", ...args);

function names2urls(names) {
   let urls = names.map(repoName => gh(`browse -n --repo ${repoName}`));
   return urls.map(u => u.replace(/\n$/, '.git'));
}

function getOrgFromRepo() {
    try {
        return gh("remote get-url --push origin")
           .replace(/^.*:/,'')
           .replace(/\/.*$/,'')
    } catch(e) {
      return false;
    }
}

let repoList;

debugger;
if (options.csr) 
  repoList = options.csr;
else if (options.file) {
    deb("options file ", options.file);
    repoList = fs.readFileSync(options.file, "utf-8")
      .replace(/\s*$/,"") // trim
      .replace(/^\n*/,"")
      .replace(/\n+/g,",")
}
deb(repoList)

let repos = repoList.split(/\s*,\s*/);
if (options.regexp) {
    let regexp = new RegExp(options.regexp,'i');
    repos = repos.filter(rn => regexp.test(rn));
}

let org = options.org || process.env["GITHUB_ORG"] || getOrgFromRepo();

const LegalGHRepoNames = /(?:([\p{Letter}\p{Number}._-]+)\/)?([\p{Letter}\p{Number}._-]+)/;

if (org) {
    repos = repos.map(r => {
      let m = LegalGHRepoNames.exec(r);
      if (!m[1]) r = org+"/"+r;
      return r;
    })
}
deb(repos)

if (options.dryrun) {
    console.log(repos.join("\n"));
    process.exit(0);
}

let urls = names2urls(repos);
deb(urls);

urls.forEach(remote => {
    // deb(`git submodule add ${remote}`);
    git('submodule add '+remote);
});
