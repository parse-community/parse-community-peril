// FROM': https://github.com/danger/peril-settings/blob/master/org/changelog.ts
// Credit to @orta
import { danger, warn, message } from "danger";

export default async () => {
  const pr = danger.github.pr

  const changelogNames = ["CHANGELOG.md", "changelog.md", "CHANGELOG.yml"]
  const isOpen = danger.github.pr.state === "open"

  const getContentParams = { owner: pr.base.user.login, repo: pr.base.repo.name, tree_sha: "master" }
  const rootContents: any = await danger.github.api.gitdata.getTree(getContentParams)

  const pathForChangelog = rootContents.data.tree.find((file: { path: string }) => changelogNames.includes(file.path))
  if (isOpen && pathForChangelog) {
    const files = [...danger.git.modified_files, ...danger.git.created_files]

    // A rough heuristic for when code should have a changelog
    const hasCodeChanges = files.find(file => !file.match(/(test|spec|readme|changelog)/i))
    // Check for a changelog
    const hasChangelogChanges = files.find(file => changelogNames.includes(file))

    // Request a CHANGELOG entry if not declared #trivial
    const isTrivial = (danger.github.pr.body + danger.github.pr.title).includes("#trivial")
    const isUser = danger.github.pr.user.type === "User"
    const isSnyk = danger.github.pr.user.id === 19733683
    // Politely ask for their name on the entry too
    if (hasCodeChanges && !hasChangelogChanges && !isTrivial && !isSnyk) {
      // const changelogDiff = await danger.git.diffForFile(pathForChangelog)
      // const contributorName = danger.github.pr.user.login
      // const hasUsernameInChanges = changelogDiff && changelogDiff.diff.includes(contributorName)
      if (false) {
        warn("Please add your GitHub name to the changelog entry, so we can attribute you correctly.")
      } else {
        warn("Please add a changelog entry for your changes.")
      }
    }
  }
}
