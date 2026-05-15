import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import {
  shouldCreateDadTicket,
  getManagerForLabel,
  isDadLabelPresent,
  getChildTickets
} from './services/ticketLogic';

const resolver = new Resolver();

// Creates backend functions that the issue panel UI can call.
resolver.define('getText', () => {
  console.log("UI called");
  return "Press button to create child tickets!";
});
// Checks whether the current issue is a DAD ticket.
resolver.define('isDadTicket', async (req) => {
  const issueKey = req.context?.extension?.issue?.key;

  if (!issueKey) {
    return false;
  }
  // Fetches the current issue so we can inspect its labels.
  const response = await api.asApp().requestJira(
    route`/rest/api/3/issue/${issueKey}`
  );

  const issueData = await response.json();
  const labels = issueData.fields.labels || [];
  console.log("Current issue labels:", labels);

  // The Decompose Activities button only appears on issues with this label.
  return isDadLabelPresent(labels);
});

// Creates Dev, Test, and System Test tickets from the current DAD ticket.
resolver.define('createChildTickets', async (req) => {
  const issueKey = req.context?.extension?.issue?.key;

  if (!issueKey) {
    throw new Error("No issue key found");
  }

  // Fetch current DAD issue so we can use its summary and linked issue
  const issueResponse = await api.asApp().requestJira(
    route`/rest/api/3/issue/${issueKey}?fields=summary,labels,issuelinks`
  );

  const issueData = await issueResponse.json();
  const parentSummary = issueData.fields.summary;

  // Each child ticket gets its own suffix and label.
  const childTickets = getChildTickets(parentSummary);
  const results = [];

  // Creates each child ticket in the same Jira project as the DAD ticket.
  for (const child of childTickets) {
    const response = await api.asApp().requestJira(
      route`/rest/api/3/issue`,
      {
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
            summary: child.summary,
            issuetype: {
              name: "Task"
            },
            labels: [child.label]
          }
        })
      }
    );

    const data = await response.json();
    results.push(data);
  }
  return results;
});

// Runs automatically when Jira sends an issue update event.
export const issueStatusHandler = async (event) => {
  console.log("Trigger fired");

  // Retrieves and logs KANBAN column status every time issue udated
  const status = event.issue?.fields?.status?.name;
  console.log("Current status:", status);

  // Only create a DAD ticket when the issue reaches this workflow status.
  if (!shouldCreateDadTicket(status)) {
    return;
  }
  console.log("Issue reached Response Issued");

  const issueKey = event.issue.key;
  const projectKey = issueKey.split('-')[0];

  // Fetches full issue details because trigger events may not include all fields.
  const issueResponse = await api.asApp().requestJira(
    route`/rest/api/3/issue/${issueKey}?fields=labels,issuelinks`
  );

  const issueData = await issueResponse.json();
  const labels = issueData.fields.labels || [];
  console.log("Labels:", labels);

  // Uses the first label to decide which delivery manager gets the DAD ticket.
  const label = labels[0];

  const assigneeAccountId = getManagerForLabel(label);
  console.log("Selected manager:", assigneeAccountId);

  // Check if a DAD ticket already exists for this issue
  const issueLinks = issueData.fields.issuelinks || [];
  let existingDadLink = false;

  for (const link of issueLinks) {
    const linkedIssue = link.inwardIssue || link.outwardIssue;
    const linkedIssueKey = linkedIssue?.key;
    
    if (!linkedIssueKey) {
      continue;
    }
    const linkedIssueResponse = await api.asApp().requestJira(
      route`/rest/api/3/issue/${linkedIssueKey}?fields=labels`
    );
    const linkedIssueData = await linkedIssueResponse.json();
    const linkedLabels = linkedIssueData.fields.labels || [];

    if (linkedLabels.includes("DAD")) {
      existingDadLink = true;
      break;
    }
  }

  console.log("Existing linked DAD ticket found:", existingDadLink);

  // Stops duplicate DAD tickets if Jira sends repeated or delayed events.
  if (existingDadLink) {
    console.log("DAD ticket already exists for this issue. Exiting.");
    return;
  }

  // Creates the DAD ticket in the same project as the original issue.
  const response = await api.asApp().requestJira(
    route`/rest/api/3/issue`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          project: {
            key: projectKey
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
          labels: ["DAD"],
          assignee: assigneeAccountId
            ? { accountId: assigneeAccountId }
            : null
        }
      })
    }
  );

  const data = await response.json();
  console.log("Created issue:", data);

  // Link DAD ticket to original issue
  const dadIssueKey = data.key;

  await api.asApp().requestJira(
    route`/rest/api/3/issueLink`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: {
          name: "Relates"
        },
        inwardIssue: {
          key: dadIssueKey
        },
        outwardIssue: {
          key: issueKey
        }
      })
    }
  );

  console.log("Linked DAD ticket to original issue");
};

// Exports all resolver functions so the frontend can call them.
export const handler = resolver.getDefinitions();