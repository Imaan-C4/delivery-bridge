import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Text } from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  const [data, setData] = useState("Loading...");

  useEffect(() => {
    invoke('getText')
      .then((result) => {
        setData(result);
      })
      .catch((err) => {
        console.error(err);
        setData("Error");
      });
  }, []);

  return (
    <>
      <Text>Static text works</Text>
      <Text>{data}</Text>
    </>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);