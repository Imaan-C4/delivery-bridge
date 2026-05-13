import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Text, Button } from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {

  // Stores text shown inside the issue panel.
  const [data, setData] = useState("Loading...");

  // Prevents button spam while tickets are being created.
  const [loading, setLoading] = useState(false);

  // Controls whether the Decompose button should appear.
  const [isDadTicket, setIsDadTicket] = useState(false);

  useEffect(() => {

    // Fetches default UI text from backend resolver.
    invoke('getText')
      .then((result) => {
        setData(result);
      })
      .catch((err) => {
        console.error(err);
        setData("Error");
      });

    // Checks if the current issue has the DAD label.
    invoke('isDadTicket')
      .then((result) => {
        setIsDadTicket(result);
      })
      .catch((err) => {
        console.error(err);
        setIsDadTicket(false);
      });

  }, []);

  // Creates Dev/Test/System Test tickets when button is clicked.
  const createChildTickets = async () => {
    try {

      // Disables button while processing.
      setLoading(true);

      const result = await invoke('createChildTickets');
      console.log("Created tickets:", result);
      setData("Child tickets created successfully!");

    } catch (err) {
      console.error(err);
      setData("Failed to create tickets");
    } finally {

      // Re-enables button after completion.
      setLoading(false);
    }
  };

  return (
    <>
      {/* Displays current UI status message */}
      {isDadTicket && <Text>{data}</Text>}

      {/* Only shows button on DAD tickets */}
      {isDadTicket && (
        <Button
          onClick={createChildTickets}
          isDisabled={loading}
        >
          {loading ? "Creating..." : "Decompose Activities"}
        </Button>
      )}
    </>
  );
};

// Renders the Forge React app inside the Jira issue panel.
ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);