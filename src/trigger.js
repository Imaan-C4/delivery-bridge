import api, { route } from "@forge/api";

export async function run(event, context) {
  const issueKey = event.issue.key;

  // Get full issue details
  const response = await api.asApp().requestJira(
    route`/rest/api/3/issue/${issueKey}`
  );

  const issue = await response.json();

  const status = issue.fields.status.name;

  console.log(`Issue ${issueKey} moved. Status: ${status}`);

  // only act when status = Response Issued
  if (status !== "Response Issed") return;

  // create child tasks (hardcoded for now)
  const tasks = ["Dev", "Test", "System Test", "UAT"];

  for (const task of tasks) {
    await api.asApp().requestJira(route`/rest/api/3/issue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          project: {
            key: issue.fields.project.key,
          },
          summary: `${task} - ${issue.fields.summary}`,
          issuetype: {
            name: "Task",
          },
        },
      }),
    });
  }

  console.log("Child tasks created");
}