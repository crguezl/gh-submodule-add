const ins = require("util").inspect;
const deb = (...args) => { 
    if (debug) console.log(ins(...args, {depth: null})); 
};

const path = require('path');
const fs = require("fs");
const shell = require('shelljs');
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
//if (process.argv.length === 2) program.help()

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

const { 
  showError, 
  sh, 
  shContinue, shStderr, gh, 
  ghCont, 
  ghCode, 
  names2urls, 
  getUserLogin, 
  getRepoListFromAPISearch,
  getNumberOfCommits,
  branches 
} = require(path.join(__dirname,'utilities.js'));



console.log(branches("ULL-MFP-AET-2122/aprender-markdown-chloe-boistel-perez-alu0100788020"));
console.log(branches("ULL-MII-SYTWS-2122/asyncserialize-mstoisor"));
process.exit(0);


// https://stackoverflow.com/questions/49442317/github-graphql-repository-query-commits-totalcount
function RepoIsEmpty(ownerSlashRepo){
  console.log("RepoIsEmpty called")
  let [owner, repo] = ownerSlashRepo.split('/');

  let query = (owner, name) => `
  query numberOfcommits {
  
    repository(owner:"${owner}", name:"${name}") {
      masterbranch: object(expression:"master") {
        ... on Commit {
          history {
            totalCount
          }
        }
      }
      mainbranch:  object(expression:"main") {
        ... on Commit {
          history {
            totalCount
          }
        }
      }
    }
  }
  `;

  let queryS = `api graphql -f query='${query(owner, repo)}'`;
  console.log(queryS)
  let result = ghCont(queryS)
  console.log(ins(result, {depth: null}));

  return result;
}


console.log(RepoIsEmpty("ULL-MII-SYTWS-2122/asyncmap-crguezl"));
console.log(RepoIsEmpty("ULL-MII-SYTWS-2122/asyncserialize-mstoisor"));
process.exit(0);

let repoList;

debugger;

if (!options.org && (program.args.length == 1) ) options.org = program.args[0];

let org = options.org || process.env["GITHUB_ORG"] || getUserLogin();
if (options.csr) 
  repoList = options.csr;
else if (options.file) {
  deb("options file ", options.file);
  repoList = fs.readFileSync(options.file, "utf-8")
    .replace(/\s*$/,"") // trim
    .replace(/^\n*/,"")
    .replace(/\n+/g,",")
} else if (options.search) {
  repoList = getRepoListFromAPISearch(options.search, org);
}
else {
  repoList = getRepoListFromAPISearch('.', org);
}
deb(repoList)

if (repoList.length === 0) {
  console.log(`No matching repos found in owner "${org}"!`);
  process.exit(0);
}

let repos = repoList.split(/\s*,\s*/);

if (options.regexp) {
    //console.log(options.regexp);
    let regexp = new RegExp(options.regexp,'i');
    //console.log(regexp.source);
    repos = repos.filter(rn => {
      return regexp.test(rn)
    });
}

const LegalGHRepoNames = /^(?:([\p{Letter}\p{Number}._-]+)\/)?([\p{Letter}\p{Number}._-]+)$/ui;
if (org) {
    repos = repos.map(r => {
      let m = LegalGHRepoNames.exec(String(r));
      //console.log(`LegalGHRepoNames matching = ${m}`);
      if (m) {
        if (!m[1]) r = org+"/"+r;
      } else 
        showError(`The repo '${r}' does not matches the pattern 'OrganizationName/repoName'`)
      return r;
    })
}

if (options.dryrun) {
    console.error("Only repos with more than one commit will be added as submodules:")

    // console.log(repos);

    //console.log("[");
    repos.forEach(r => {
      if (RepoIsEmpty(r)) { 
        console.error(`${r} has no commits`);
        return;
      }
      // let [db, nc] = getNumberOfCommits(r);
      // let nc = 0;
      console.log(`${r}`);
    });
    //console.log("]");

    process.exit(0);
}

let urls = names2urls(repos);
deb(urls);

urls.forEach((remote, i) => {
    let repo = repos[i];
    try {
      let isEmpty = RepoIsEmpty(repo);
      if (isEmpty) {
        console.log(`Skipping to add repo ${remote} because is empty!`)
      }
      else {
        console.log(`git submodule add ${remote}`);
        let result = shell.exec('git submodule add '+remote, {silent: false});
        if ((result.code !== 0) || result.error) {
          shell.echo(`Error: Command "${command}" failed\n${result.stderr}`);
          console.log(`Skipping to add repo ${remote}!\n\n`)
        }      
      }
    } catch(e) {
      console.log(`Skipping to add repo ${remote} because:\n${e}\n\n`)
    }

});
