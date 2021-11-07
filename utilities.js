const ins = require("util").inspect;
const debug = false;
const deb = (...args) => { 
    if (debug) console.log(ins(...args, {depth: null})); 
};
const path = require('path');
const fs = require("fs");
const shell = require('shelljs');

function showError(error) {
  if (error) {
    console.error(`Error!: ${error}`);
    process.exit(1); 
  }
}
exports.showError = showError;

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
exports.sh = sh;

function shContinue(executable, ...args) {
  let command = `${executable} ${args.join('')}`;
  deb(command);
  let result = shell.exec(command, {silent: true});
  if (result.code !== 0) {
    shell.echo(`Error: Command "${command}" failed\n${result.stderr}`);
  }    
  return result.stdout.replace(/\s+$/,'');
}
exports.shContinue = sh.shContinue;

function shStderr(executable, ...args) {
  
  let command = `${executable} ${args.join('')}`;
  // console.log(command);
  let result = shell.exec(command, {silent: true});
  return result.stderr; 
}
exports.shStderr = shStderr;

const gh = (...args) => sh("gh", ...args);
exports.gh = gh;
const ghCont = (...args) => shContinue("gh", ...args);
exports.ghCont = ghCont;
const ghCode = (...args) => shStderr("gh", ...args);
exports.ghCode = ghCode;

function names2urls(names) {
  let urls = names.map(repoName => gh(`browse -n --repo ${repoName}`));
  return urls.map(u => u.replace(/\n$/, '.git'));
}
exports.names2urls = names2urls;

function getUserLogin() {
  /* See also 
     gh auth status -t
     give us the user and the token
  */
  let result = gh(`api 'user' --jq .login`);
  return result; 
}
exports.getUserLogin = getUserLogin;

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
exports.getRepoListFromAPISearch = getRepoListFromAPISearch;

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
exports.getNumberOfCommits = getNumberOfCommits;

function branches(ownerSlashRepo) {
  console.log("HasBranches called")
  let [owner, repo] = ownerSlashRepo.split('/');

  let query = (orgName, repoName) => `
    query {
      organization(login: "${orgName}") {
        repository(name: "${repoName}") {
          id
          name
          refs(refPrefix: "refs/heads/", first: 10) {
            edges {
              
              node {
                branchName:name
              }
            }
            pageInfo {
              
              endCursor #use this value to paginate through repos with more than 100 branches
            }
          }
        }
      }
    }
    `
  let queryS = `api graphql -f query='${query(owner, repo)}'`;
  //console.log(queryS)
  let result = ghCont(queryS)
  let branchNames = JSON.parse(result).data.organization.repository.refs.edges; // array of branch names

  if (branchNames.length) {
    branchNames = branchNames.map(b => b.node.branchName)
  }

  return branchNames;

}
exports.branches = branches;

