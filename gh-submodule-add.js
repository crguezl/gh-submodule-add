const ins = require("util").inspect;
const debug = false; 
const deb = (...args) => { 
    if (debug) console.log(ins(...args, {depth: null})); 
};

const shell = require('shelljs');
 
deb(process.argv);

let repoList = process.argv[2];

if (!repoList) usage("Provide a comma-separated list of GitHub hosted repos");
if (!shell.which('git')) {
  usage('Sorry, this extension requires git installed!');
}
if (!shell.which('gh')) {
    usage('Sorry, this extension requires GitHub Cli (gh) installed!');
}

const isGitFolder = sh("git rev-parse --is-inside-work-tree");
if (!isGitFolder) {
    usage('Sorry, current folder is not a git repo!');
}

function usage(error) {
    const help = 
    `
    Usage:

    gh-submodule-add '<[org1]/repo1>,...,<[orgN]/repoN>'
    
    adds to the current repo the repos specified in the comma separated list 
    'org1/repo1, org2/repo2', etc as git submodules of the current repo. 
    - If some org as  'org1' is not specified, it is assumed to be  the 
      same organization of the current repo.
    - If one of the repos does'nt exist, throw an error.
`
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

const git = (...args) => sh("echo git", ...args);


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
