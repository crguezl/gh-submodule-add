const ins = require("util").inspect;
const deb = (...args) => { 
    if (debug) console.log(ins(...args, {depth: null})); 
};

const fs = require("fs");
const shell = require('shelljs');
const { Command } = require('commander');

const help = 
`
gh-submodule-add -c '<[org1]/repo1>,...,<[orgN]/repoN>'

Execute this command in the project root directory of the repo.
This extension adds to the current repo the repos specified in the comma separated list 
'org1/repo1, org2/repo2', etc as git submodules of the current repo. 
- If some org as  'org1' is not specified, it is assumed to be  the 
  same organization of the current repo.
- If one of the repos doesn't exist, it throw an error.
- If the current repo has no "remote", it  is created one in GitHub with alias "origin"  
`

const program = new Command();
program.version(require('./package.json').version);

program
  .usage(help)
  .option('-d, --debug', 'output extra debugging')
  .option('-s, --search <query>', 'search <query >using GitHub Syntax')
  .option('-r, --reg <regexp>', 'filter <query> results using <regexp>. Implies -s')
  .option('-c, --csr <comma separated list of repos>', 'the list of repos is specified as a comma separated list');

program.parse(process.argv);
const debug = program.debug; 

const options = program.opts();
deb(options);

let repoList = options.csr;  

if (!repoList) usage("Provide a comma-separated list of GitHub hosted repos");

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

let repos = repoList.split(/\s*,\s*/);
deb(repos)

let urls = names2urls(repos);
deb(urls);

urls.forEach(remote => {
    // deb(`git submodule add ${remote}`);
    git('submodule add '+remote);
});
