import Resolver from '@forge/resolver';

import api, { route } from '@forge/api';

const resolver = new Resolver();

// UI (Issue Panel)
resolver.define('getText', () => {
  console.log("UI called");
  return "Hello, world!";
});

export const handler = resolver.getDefinitions();

//Trigger

export const issueStatusHandler = async (event) => {
  console.log("Trigger fired");

  const status = event.issue?.fields?.status?.name;

  console.log("Current status:", status);

  if (status === "Response Issued") {
    console.log("Issue reached Response Issued");

    const issueKey = event.issue.key;

    // Creating new issue
    const response = await api.asApp().requestJira(route`/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          project: {
            key: issueKey.split('-')[0]
          },
          summary: "DAD",
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: `Auto-created from ${issueKey}`
                  }
                ]
              }
            ]
          },
          issuetype: {
            name: "Task"
          },

          // Label for filtering KANBAN board 
          labels: ["DAD"]
        }
      })
    });

    const data = await response.json();

    console.log("Created issue:", data);
  }
};