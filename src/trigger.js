export const handler = async (event) => {
  console.log("Trigger fired");
  console.log(JSON.stringify(event, null, 2));

  const issue = event.issue;

  if (issue.fields.status.name !== "Response Issued") {
    return;
  }

  console.log("Correct status reached → create tickets here");
};