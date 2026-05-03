import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

// UI (Issue Panel)
resolver.define('getText', () => {
  console.log("UI called");
  return "Hello, world!";
});

// Trigger 
export const handler = resolver.getDefinitions();

export const issueStatusHandler = async (event) => {
  console.log("Trigger fired");

  const status = event.issue?.fields?.status?.name;

  console.log("Current status:", status);

  if (status === "Response Issued") {
    console.log("Issue reached Response Issued");

    const issueKey = event.issue.key;

    // fetch issue details to get label
    const issueResponse = await api.asApp().requestJira(
      route`/rest/api/3/issue/${issueKey}`
    );

    const issueData = await issueResponse.json();

    //  Get label from original issue
    const labels = issueData.fields.labels || [];
    console.log("Labels:", labels);

    const label = labels[0]; // for now assuming single label

    // map labels to delivery managers (account IDs)
    const managerMap = {
      green: "712020:5922a8fa-72be-4224-9d69-c2a71a5cd3a7", // i.choudharyx ID 
      blue: "712020:8fae6ecc-0929-4386-8d71-9b16162a2ae5", // c3070475@hallam.shu.ac.uk ID
      red: "712020:1064872d-7c70-430a-84da-7beebb53fd22" // imaan.choudhary@capgemini.com ID
    };

    const assigneeAccountId = managerMap[label];

    console.log("Selected manager:", assigneeAccountId);

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

          // DAD label (for Kanban filtering)
          labels: ["DAD"],

          // assign ticket based on label of original issue
          assignee: assigneeAccountId
            ? { accountId: assigneeAccountId }
            : null
        }
      })
    });

    const data = await response.json();

    console.log("Created issue:", data);
  }
};