const ins = require("util").inspect;
const deb = (...args) => { 
    if (debug) console.log(ins(...args, {depth: null})); 
};

const fs = require("fs");
const shell = require('shelljs');
const { Command } = require('commander');

const program = new Command();
program.version(require('./package.json').version);

program
  .name("gh submodule-add")
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
  const isGitFolder = sh("git rev-parse --is-inside-work-tree");

  if (!isGitFolder || !fs.existsSync(".git")) {
    showError('Sorry, current folder is not the root of a git repo!');
  }
}

function showError(error) {
  if (error) {
    console.error(`Error!: ${error}`);
    process.exit(1); 
  }
}

function sh(executable, ...args) {
    let command = `${executable} ${args.join('')}`;
    deb(command);
    let result = shell.exec(command, {silent: true});
    if (result.code !== 0) {
      shell.echo(`Error: Command "${command}" failed\n${result.stderr}`);
      shell.exit(result.code);
    }    
    return result.stdout.replace(/\s+$/,'');
}

function shContinue(executable, ...args) {
  let command = `${executable} ${args.join('')}`;
  deb(command);
  let result = shell.exec(command, {silent: true});
  if (result.code !== 0) {
    shell.echo(`Error: Command "${command}" failed\n${result.stderr}`);
  }    
  return result.stdout.replace(/\s+$/,'');
}

function shStderr(executable, ...args) {
  
  let command = `${executable} ${args.join('')}`;
  // console.log(command);
  let result = shell.exec(command, {silent: true});
  return result.stderr; 
}


const gh = (...args) => sh("gh", ...args);
const ghCont = (...args) => shContinue("gh", ...args);
const ghCode = (...args) => shStderr("gh", ...args);

// const git = (...args) => sh("git", ...args);

function names2urls(names) {
   let urls = names.map(repoName => gh(`browse -n --repo ${repoName}`));
   return urls.map(u => u.replace(/\n$/, '.git'));
}

function getUserLogin() {
   /* See also 
      gh auth status -t
      give us the user and the token
   */
   let result = gh(`api 'user' --jq .login`);
   return result; 
}

function getRepoListFromAPISearch(search, org) {
  let jqQuery;
  let query;
  
  if (!org) {
    console.error("Aborting. Specify a GitHub organization");
    process.exit(1);
  }
  if (search !== ".") {
    query = `search/repositories?q=org%3A${org}`;
    query +=`%20${encodeURIComponent(search)}`;  
    jqQuery ='.items | .[].full_name';
  } else {
    /* Or get all repos */
    if (gh(`api "users/${org}" -q '.type'`).match(/Organization/i)) {
      query = `orgs/${org}/repos`;
    }
    else
      query = `users/${org}/repos`;
      jqQuery='.[].full_name'
  }

  let command = `api --paginate "${query}" -q "${jqQuery}"`;

  let repos = gh(command).replace(/\s+$/,'').replace(/^\s+/,'');

  let result = repos.split(/\s+/);
   
  result = result.join(",");

  return result;
}

function getNumberOfCommits(ownerSlashRepo) {
  let [owner, repo] = ownerSlashRepo.split('/');
  let defaultBranch = gh(`api /repos/${ownerSlashRepo} --jq .default_branch`);
  // console.log(owner, repo);
  const queryNumberOfCommits = `'
  query {
    repository(owner:"${owner}", name:"${repo}") {
      object(expression:"${defaultBranch}") {
        ... on Commit {
          history {
            totalCount
          }
        }
      }
    }
  }'`

  if (RepoIsEmpty(ownerSlashRepo)) {
     return ['no branch', 0];
  } else {
    let numCommits =  ghCont(`api graphql --paginate -f query=${queryNumberOfCommits} --jq .[].[].[].[].[]`)
    return [defaultBranch, numCommits ];
  }
    
}

function RepoIsEmpty(ownerSlashRepo){
  let result = ghCode(` api '/repos/${ownerSlashRepo}/contents/'`);
  //console.log(result);
  return result.match(/empty.*404/) !== null;
}


//console.log(RepoIsEmpty("ULL-MII-SYTWS-2122/asyncmap-crguezl"));
//console.log(RepoIsEmpty("ULL-MII-SYTWS-2122/asyncserialize-mstoisor"));

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
  showError("Provide one of the options '-s', '-f' or '-c'");
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
