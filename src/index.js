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
  }
};
