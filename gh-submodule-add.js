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
`

const program = new Command();
program.version(require('./package.json').version);

program
  .usage(help)
  .option('-d, --debug', 'output extra debugging')
  .option('-s, --search <query>', "search <query> using GitHub Search API. A dot '.' refers to all the repos")
  .option('-r, --regexp <regexp>', 'filter <query> results using <regexp>')
  .option('-c, --csr <comma separated list of repos>', 'the list of repos is specified as a comma separated list')
  .option('-f, --file <file>', 'file with the list of repos, one per line')
  .option('-n --dryrun','just show what repos will be added as submodules')
  .option('-o --org <org>', 'default organization or user');

program.addHelpText('after', `
  You can set the default organization through the GITHUB_ORG environment variable`
);
  

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

if (!isGitFolder || !fs.existsSync(".git")) {
    usage('Sorry, current folder is not the root of a git repo!');
}

function showError(error) {
  if (error) console.error(`Error!: ${error}`);
  if (error) process.exit(1); 
 
}
function usage(error) {

    if (error) console.error(`Error!: ${error}`);
    if (error) process.exit(1); 
    console.log(help)
    console.log(`
    If the option '-s .' ( a dot) is used all the repos inside the organization will be used.
    Constrain the result using the option '-r <regexp>'

    Environment variable GITHUB_ORG sets the default organization/user
`)
  process.exit(0);
}

function sh(executable, ...args) {
    let command = `${executable} ${args.join('')}`;
    deb(command);
    let result = shell.exec(command, {silent: true});
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

function getUserLogin() {
    try {
        let result = gh(`api 'user' --jq .login`); 

        if (result.code !== 0) return false;
        return result.stdout;
    } catch(e) {
      return false;
    }
}

function getRepoListFromAPISearch(search, org) {
  // throw("Search option not implemented yet!");
  let jqQuery;
  let query;
  
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

let repoList;

debugger;

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
  usage("Provide one of the options '-s', '-f' or '-c'");
}
deb(repoList)

let repos = repoList.split(/\s*,\s*/);
if (options.regexp) {
    let regexp = new RegExp(options.regexp,'i');
    repos = repos.filter(rn => regexp.test(rn));
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
deb(repos)

if (options.dryrun) {
    console.log("These repos will be aded as submodules:")
    console.log(repos.join("\n"));
    process.exit(0);
}

let urls = names2urls(repos);
deb(urls);

urls.forEach(remote => {
    console.log(`git submodule add ${remote}`);
    git('submodule add '+remote);
});
