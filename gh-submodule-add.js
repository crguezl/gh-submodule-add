const ins = require("util").inspect;
const debug = true; 
const deb = (...args) => { 
    if (deb) console.log(ins(...args, {depth: null})); 
};

deb(process.argv);

let repoList = process.argv[2];

if (!repoList) usage("Provide a comma-separated list of GitHub hosted repos");

function usage(error) {
    const help = 
    `
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

let repos = repoList.split(/\s*,\s*/);
deb(repos)
