import { danger } from "danger"
import { IssueComment } from "github-webhook-event-types"

// The shape of a label
interface Label {
  id: number
  url: string
  name: string
  description: string
  color: string
  default: boolean
}

/** If a comment to an issue contains "Merge on Green", apply a label for it to be merged when green. */
export default async (issueComment: IssueComment) => {
  console.log('RUN', issueComment, typeof issueComment);
  const issue = issueComment.issue
  const comment = issueComment.comment
  const api = danger.github.api

  // Only look at PR issue comments, this isn't in the type system
  if (!(issue as any).pull_request) {
    console.error("Not a Pull Request")
    return
  }

  // Don't do any work unless we have to
  const keywords = ["merge on green", "merge on ci green"]
  const match = keywords.find(k => comment.body.toLowerCase().includes(k))
  const sender = comment.user
  const username = sender.login
  const org = issueComment.repository.owner.login

  danger.warn(`Running with ${username}`);
  if (username.indexOf('greenkeeper') < 0) {
    return console.log('bailing, not greenkeeper');
  }
  // Check for org access, so that some rando doesn't
  // try to merge something without permission
  try {
    await api.orgs.checkMembership({ org, username })
  } catch (error) {
    // Someone does not have permission to force a merge
    return console.error("Sender does not have permission to merge")
  }

  // Create or re-use an existing label
  const owner = org
  const repo = issueComment.repository.name
  const existingLabels = await api.issues.getLabels({ owner, repo })
  const mergeOnGreen = existingLabels.data.find((l: Label) => l.name == "Merge On Green")

  // Create the label if it doesn't exist yet
  if (!mergeOnGreen) {
    const newLabel = await api.issues.createLabel({
      owner,
      repo,
      name: "Merge On Green",
      color: "247A38",
      description: "A label to indicate that Peril should merge this PR when all statuses are green",
    } as any)
  }

  // Then add the label
  await api.issues.addLabels({ owner, repo, number: issue.number, labels: ["Merge On Green"] })
  console.log("Updated the PR with a Merge on Green label")
}
