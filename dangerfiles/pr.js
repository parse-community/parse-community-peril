function includes(object, value) {
  if (typeof object == 'undefined') { return false; }
  if (Array.isArray(object) || typeof object == 'string') { return object.indexOf(value) > -1; }
  return !!object[value]
}

if (!danger.github.pr) {
  warn("Unable to read the PR...");
  message("Not properly configured...");
} else {
  const hasChangelog = includes(danger.git.modified_files, "changelog.md")
  const isTrivial = includes(danger.github.pr.body + danger.github.pr.title, "#trivial")
  const isGreenkeeper = danger.github.pr.user.login === "greenkeeper"

  if (!hasChangelog && !isTrivial && !isGreenkeeper) {
    warn("Please add a changelog entry for your changes.")

    // Politely ask for their name on the entry too
    const changelogDiff = danger.git.diffForFile("changelog.md")
    console.log(changelogDiff);
    const contributorName = danger.github.pr.user.login
    if (changelogDiff && !includes(changelogDiff, contributorName)) {
      warn("Please add your GitHub name to the changelog entry, so we can attribute you correctly.")
    }
  }
}
