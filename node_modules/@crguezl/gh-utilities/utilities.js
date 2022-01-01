const ins = require("util").inspect;
const tmp = require('tmp');
const debug = false;
const deb = (...args) => {
  if (debug) console.log(ins(...args, { depth: null }));
};
const fs = require("fs");
const shell = require('shelljs');
const path = require('path');

const concurrently = 'npx concurrently';
//console.log(concurrently);

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
  let result = shell.exec(command, { silent: true });
  if (result.code !== 0) {
    shell.echo(`Error: Command "${command}" failed\n${result.stderr}`);
    shell.exit(result.code);
  }
  return result.stdout.replace(/\s+$/, '');
}
exports.sh = sh;

function shContinue(executable, ...args) {
  let command = `${executable} ${args.join('')}`;
  deb(command);
  let result = shell.exec(command, { silent: true });
  if (result.code !== 0) {
    shell.echo(`Error: Command "${command}" failed\n${result.stderr}`);
  }
  return result.stdout.replace(/\s+$/, '');
}
exports.shContinue = sh.shContinue;

function shStderr(executable, ...args) {

  let command = `${executable} ${args.join('')}`;
  // console.log(command);
  let result = shell.exec(command, { silent: true });
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
  return urls.map(u => u.replace(/\s*$/, '.git'));
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

function getRepoListFromAPISearch(options, org) {
  let search = options.search;
  let regexp = options.regexp;
  //let query;
  const allRepos = (org) => `
  query($endCursor: String) {
    organization(login: "${org}") {
      repositories(first: 100, after: $endCursor) {
        pageInfo {
          endCursor
          hasNextPage
        }
        edges {
          node  {
            name
          }
        }
      }
    }
  }
  `
  const searchForRepos = (search, org) => `
  query($endCursor: String) {
    search(type: REPOSITORY, query: "org:${org} ${search} in:name", first: 100, after: $endCursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          ... on Repository {
            name
          }
        }
      }
    }
  }
  `

  function executeQuery(query) {
    let command = `gh api graphql --paginate -f query='${query}'`;
    //console.log(command);

    let queryResult = shell.exec(command, { silent: true });
    if (queryResult.code !== 0 || queryResult.length === 0) {
      console.error(`No repos found in org "${org}" matching query "${search}"`)
      process.exit(1);
    }
    return JSON.parse(queryResult).data;
  }

  function fzfGetRepos(org, regexp) {
    /*
    let command = `gh repo list -L100 ${org} --json name --jq '.[] | .name' | fzf -m`;
    let result = shell.exec(command, { silent: false });
    if (result.code !== 0) process.exit(result.code);
    return result.stdout.replace(/\s+$/,'')  
    */
  
    let queryResult = executeQuery(allRepos(org));
    let result = queryResult.organization.repositories.edges.map(r => r.node.name);

    if (regexp) {
      regexp = new RegExp(regexp,'i');
      result = result.filter(rn => {
        return regexp.test(rn)
      });  
    }

    result = result.join("\n");

    const name = tmp.tmpNameSync();
    fs.writeFileSync(name, result)

    //console.log('Created temporary filename: ', name);
    let command = `cat ${name} | fzf -m --prompt='${org}:Use tab to choose repos to download> ' --layout=reverse --border`;
    let fzfresult = shell.exec(command, { silent: false });
    console.clear();

    if (!fzfresult || fzfresult.code !== 0) {
      return [];
    }
    // console.log(`"${fzfresult}"`);
    let repoList =  fzfresult.stdout.replace(/\s+$/,'').split(/\s+/);
    let repoSpec =  repoList.join(',');
    //console.log(`----\n${repoSpec}\n----`);
    return repoSpec;
  }
  

  //console.log('getRepoListFromAPISearch '+search+" "+org)
  if (!org) {
    console.error("Aborting. Specify a GitHub organization");
    process.exit(1);
  }

  try {
    if (search === ".") {
      return fzfGetRepos(org, regexp);
    } else {
      let queryResult = executeQuery(searchForRepos(search, org));
      let result = queryResult.search.edges.map(r => r.node.name).join(",");

      //console.log(result)
      return result;

    }

  } catch (error) {
    console.error(`${error}: No repos found in org "${org}" matching query "${search}"`)
  }

}

/* REST version
function getRepoListFromAPISearch(search, org) {
  let jqQuery;
  let query;

  //console.log('getRepoListFromAPISearch '+search+" "+org)
  if (!org) {
    console.error("Aborting. Specify a GitHub organization");
    process.exit(1);
  }

  try {
    if (search !== ".") {
      query = `search/repositories?q=org%3A${org}`;
      query += `%20${encodeURIComponent(search)}%20in%3Aname`;
      jqQuery = '.items | .[].full_name';
    } else {
      // Or get all repos 
      if (gh(`api "users/${org}" -q '.type'`).match(/Organization/i)) {
        query = `orgs/${org}/repos`;
      }
      else
        query = `users/${org}/repos`;
      jqQuery = '.[].full_name'
    }

    let command = `gh api --paginate "${query}" -q "${jqQuery}"`;
    let queryResult = shell.exec(command, { silent: true });
    if (queryResult.code !== 0 || queryResult.length === 0) {
      console.error(`No repos found in org "${org}" matching query "${search}"`)
      process.exit(1);
    }
    let repos = queryResult.stdout.replace(/\s+$/, '').replace(/^\s+/, '');

    let result = repos.split(/\s+/);

    result = result.join(",");

    return result;
  } catch (error) {
    console.error(`No repos found in org "${org}" matching query "${search}"`)
  }

}
*/

exports.getRepoListFromAPISearch = getRepoListFromAPISearch;

function getRepoListFromFile(file) {
  return fs.readFileSync(file, "utf-8")
    .replace(/\s*$/, "") // trim
    .replace(/^\n*/, "")
    .replace(/\n+/g, ",")
}
exports.getRepoListFromFile = getRepoListFromFile;

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
    let numCommits = ghCont(`api graphql --paginate -f query=${queryNumberOfCommits} --jq .[].[].[].[].[]`)
    return [defaultBranch, numCommits];
  }

}
exports.getNumberOfCommits = getNumberOfCommits;

function branches(ownerSlashRepo) {
  let [owner, repo] = ownerSlashRepo.split('/');

  let query = (orgName, repoName) => `
    query {
      organization(login: "${orgName}") {
        repository(name: "${repoName}") {
          id
          name
          refs(refPrefix: "refs/heads/", first: 2) {
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

function numBranches(ownerSlashRepo) {
  let splitted = ownerSlashRepo.map(r => r.split('/'));
  let alias = splitted.map(r => r[1]).map(r => r.replace(/[.-]/g, '_'));

  let query = (alias, orgName, repoName) => {
    return `
      ${alias}: organization(login: "${orgName}") {
        repository(name: "${repoName}") {
          id
          name
          refs(refPrefix: "refs/heads/", first: 2) {
            edges {
              node {
                branchName:name
              }
            }
          }
        }
      }

    `
  }

  let bigQuery = 'query {\n';
  splitted.forEach(([org, repo], i) => {
    bigQuery += query(alias[i], org, repo)
  });
  bigQuery += '\n}';

  //console.log(bigQuery);


  let queryS = `api graphql -f query='${bigQuery}'`;
  //console.log(queryS)

  try {
    result = ghCont(queryS)
    result = JSON.parse(result);
  
    let branchesLengths = alias.map((a, i) => result.data[a].repository.refs.edges.length)
    return branchesLengths;  
  } catch(e) {
    throw "Error inside function 'numBranches'\n"+e
  }

}
exports.numBranches = numBranches;

/*
let testArr = [
  "ULL-MFP-AET-2122/aprender-markdown-anabel-coello-perez-alu0100885200",
  "ULL-MII-SYTWS-2122/asyncserialize-lorenaolaru",
  "ULL-MFP-AET-2122/aprender-markdown-adela-gonzalez-maury-alu0101116204"
]
console.log(numBranches(testArr));
process.exit(0);
*/

// https://stackoverflow.com/questions/49442317/github-graphql-repository-query-commits-totalcount
function RepoIsEmpty(ownerSlashRepo) {
  return !branches(ownerSlashRepo).length;
}
exports.RepoIsEmpty = RepoIsEmpty;

function fzfGetOrg() {
  let command = `gh api --paginate /user/memberships/orgs  --jq '.[].organization | .login' | fzf  --prompt='Choose an organization> ' --layout=reverse --border`;
  let orgResult = shell.exec(command, { silent: false });
  //console.log(orgResult);
  //console.log(`'${orgResult.stdout}'`);
  if (orgResult.code == 0) return orgResult.stdout.replace(/\s+/, '');
  if (process.env["GITHUB_ORG"])  return process.env["GITHUB_ORG"];
  console.error("Please, provide a GitHub Organization to work with!");
  process.exit(0);
}
exports.fzfGetOrg = fzfGetOrg;



function getRepoList(options, org) {
  let repos;
  if (options.csr)
    repos = options.csr;
  else if (options.file)
    repos = getRepoListFromFile(options.file);
  else if (options.search) {
    repos = getRepoListFromAPISearch(options, org);
  }
  else {
    repos = getRepoListFromAPISearch('.', org);
  }
  repos = repos.length ? repos.split(/\s*,\s*/) : [];
  repos = addImplicitOrgIfNeeded(repos, org);

  return repos;

}
exports.getRepoList = getRepoList;

const LegalGHRepoNames = /^(?:([\p{Letter}\p{Number}._-]+)\/)?([\p{Letter}\p{Number}._-]+)$/ui;
function addImplicitOrgIfNeeded(repos, org) {
  //console.log(repos);
  if (org) {
    return repos.map(r => {
      let m = LegalGHRepoNames.exec(String(r));
      if (m) {
        if (!m[1]) r = org + "/" + r;
      } else
        showError(`The repofnames2 '${r}' does not matches the pattern 'OrganizationName/repoName'`)
      return r;
    })
  }
  return repos;
}
exports.addImplicitOrgIfNeeded = addImplicitOrgIfNeeded;


function addSubmodules({urls, repos, parallel, depth, cloneOnly, submoduleArgs=[], cloneArgs}) {
  //console.log(repos);
  let nb = numBranches(repos)
  parallel = Math.min(parallel, urls.length);
  let par = `${concurrently}  -m ${parallel} `;

  console.log(`cloning with ${parallel} concurrent processes ...`);
  urls.forEach(
    (url, i) => {
      let isEmpty = nb[i] === 0;
      if (isEmpty && !cloneOnly) {
        console.log(`Skipping to add repo ${url} because is empty!`)
      }
      else {
        let command = ` "git clone ${url} ${cloneArgs.join(' ')}"`;
        if (depth) command += ` --depth ${depth}`
        par += command;
      }
    })
  //console.log(par);
  let result = shell.exec(par, { silent: false });
  if (result.code !== 0) {
    console.error(`Error: Command "${par}" failed\n${result.stderr}`);
  }

  // add submodules sequentially and absorbgitdirs
  console.log(cloneOnly);
  if (!cloneOnly) {
    console.log("Inside urls.forEach")
    urls.forEach(
      (url, i) => {
        let isEmpty = nb[i] === 0;
        if (isEmpty) {
          console.log(`Skipping to add repo ${url} because is empty!`)
        }
        else {
          let repoName = repos[i].split('/')[1];
          let command = `git submodule add ${url} ${submoduleArgs.join(" ")}; git submodule absorbgitdirs ${repoName}`;
          let result = shell.exec(command, { silent: false });
          if ((result.code !== 0) || result.error) {
            shell.echo(`Error: Command "${command}" failed\n${result.stderr}`);
            console.log(`Skipping to add repo ${url}!\n\n`)
          }
        }
      })
  }

}
exports.addSubmodules = addSubmodules;



//fzfGetOrg();
//getRepoListFromAPISearch('.', 'ULL-ESIT-DMSI-1920')
