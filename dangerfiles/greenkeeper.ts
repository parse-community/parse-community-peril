import { danger, warn } from "danger"

// The shape of a label
interface Label {
  id: number
  url: string
  name: string
  description: string
  color: string
  default: boolean
}

export default async () => {
  const api = danger.github.api
  const pr = danger.github.pr
  const commits = danger.github.commits;
  const { user } = pr;

  if (user.id !== 19733683 || user.type !== 'User') {
    if (user.login === 'snyk-bot') {
      warn('Snyk bot changed its ID');
    }
    return;
  }
  
  if (pr.state !== 'open') {
    console.log('not doing anything... pr is not opened');
    return;
  }

  // Create or re-use an existing label
  const org = danger.github.thisPR.owner;
  const owner = org
  const { repo } = danger.github.thisPR;
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
  const number = danger.github.thisPR.number;
  const labels = await api.issues.getIssueLabels({ owner, repo, number })
  const existLabel = labels.data.find((l: Label) => l.name == "Merge On Green");
  if (!existLabel) {
    // Then add the label
    await api.issues.addLabels({ owner, repo, number, labels: ["Merge On Green"] })
    console.log("Updated the PR with a Merge on Green label")
  }

  const reviews = await api.pullRequests.getReviews({owner, repo, number })
  const lastCommitSHA = commits[commits.length-1].sha;
  console.log(`found ${reviews.data.length} reviews`)
  
  const validReview = reviews.data.find((r) => {
    console.log('Is good', r.state, r.commit_id, lastCommitSHA);
    return r.state !== "DISMISSED" && r.commit_id === lastCommitSHA;
  });

  console.log(`found ${validReview} validReviews`)
  if (!validReview) {
    const review = await api.pullRequests.createReview({owner, repo, number, event: 'APPROVE' })
    console.log("Approved the PR as merged on green", review.data.id)
  }
}
  
