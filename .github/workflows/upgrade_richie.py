#! /usr/bin/python3

import os
import subprocess as cmd
import sys
import time

from git import GitCommandError, Repo
from github import Github, GithubException, UnknownObjectException


def getRepoFromURl(url):
    split = repo_url.replace("https://github.com/", "").split("/")
    owner = None
    try:
        owner = g.get_organization(split[0])
    except UnknownObjectException:
        owner = g.get_user(split[0])
    return owner.get_repo(split[1])


if len(sys.argv) < 2:
    print(f"Usage: {sys.argv[0]} VERSION GITHUB_TOKEN")
    exit(1)

version = sys.argv[1]
token = sys.argv[2]

# Delete "v" in front of the tag name
version = version[1:]

g = Github(token)
user = g.get_user()

repo_url = "https://github.com/openfun/richie-site-factory"
repo = getRepoFromURl(repo_url)

fork_url = f"https://github.com/{user.login}/{repo.name}"

base_branch = "master"
branch_name = "upgrade-richie"

number_of_sites = 5

# Make sure there is not already an existing fork
try:
    user.get_repo(repo.name).delete()
    # Wait for GitHub to delete the repository
    time.sleep(10)
except GithubException:
    # Repository does not exist
    pass

fork = user.create_fork(repo)
# Wait for github to create the fork
time.sleep(10)

fork.create_git_ref(
    f"refs/heads/{branch_name}", fork.get_branch(base_branch).commit.sha
)

local_repo = Repo.clone_from(
    fork_url, os.path.join(os.getcwd(), repo.name), branch=base_branch
)
Repo.create_remote(local_repo, "upstream", repo_url)

cmd.run(
    f"cd {repo.name}; \
        git checkout {branch_name}; \
        git config user.email 'upgrade-bot'; \
        git config user.name 'upgrade-bot@fun-mooc.fr'; \
        ./bin/upgrade "
    + version
    + " -c; \
        git push;",
    shell=True,
)

# local_repo.remote().push()

# Prints all commit messages separated by \n
commits = cmd.run(
    f'cd {repo.name}; \
                    git log --pretty="%s" {branch_name}',
    stdout=cmd.PIPE,
    shell=True,
).stdout.decode("utf-8")
last_commits = commits.split("\n")[:number_of_sites]

body = ""
for commit in last_commits:
    body += "### " + commit + "\n"

body += (
    f"Changelog available at https://github.com/openfun/richie/releases/tag/v{version}"
)

repo.create_pull(
    title=f"Upgrade to richie {version}",
    body=body,
    base=base_branch,
    head=f"{user.login}:{branch_name}",
)
